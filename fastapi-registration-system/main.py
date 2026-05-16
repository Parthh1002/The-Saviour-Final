import os
import random
import smtplib
from email.message import EmailMessage
from typing import Dict
from datetime import datetime, timedelta

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager

# --- Configuration ---
GMAIL_USER = os.environ.get("GMAIL_USER", "jhondoe.11012@gmail.com")
GMAIL_APP_PASS = os.environ.get("GMAIL_APP_PASSWORD", "sjxn yoyo pled ehvk")
MONGO_URI = os.environ.get("MONGO_URI", "")

# --- Startup Diagnostics ---
print(f"🔧 GMAIL_USER loaded: {GMAIL_USER}")
print(f"🔧 GMAIL_APP_PASSWORD set: {'YES ✅' if GMAIL_APP_PASS and GMAIL_APP_PASS != 'sjxn yoyo pled ehvk' else 'NO - using default ⚠️'}")
print(f"🔧 MONGO_URI set: {'YES ✅' if MONGO_URI else 'NO ⚠️'}")

# --- MongoDB Client ---
client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    if MONGO_URI:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client["saviour_registration"]
        print("✅ MongoDB Connected!")
    else:
        print("⚠️ No MONGO_URI set. Running without persistent DB.")
    yield
    if client:
        client.close()
        print("🛑 MongoDB Disconnected.")

# --- Setup ---
app = FastAPI(title="Guardian AI Registration System", lifespan=lifespan)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ SERVER CRASH: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*"
        }
    )

# Add Universal CORS middleware (God Mode: No more CORS blocks)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Mount static only if directory exists
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Use pbkdf2_sha256 for password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# In-memory temporary storage for pending OTP verifications
pending_users: Dict[str, dict] = {}

# --- Models ---
class UserRegister(BaseModel):
    fullname: str
    username: str
    email: EmailStr
    password: str
    role: str = "officer"

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class ResendOTP(BaseModel):
    email: EmailStr

# --- Email Logic ---
def send_otp_email(email: str, otp: str):
    msg = EmailMessage()
    msg["Subject"] = "Verify your The Saviour Account"
    msg["From"] = GMAIL_USER
    msg["To"] = email

    msg.set_content(f"""
    Hi there!

    Your OTP verification code is: {otp}

    This code will expire in 10 minutes.
    """)

    msg.add_alternative(f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
        <h2 style="color: #1e293b; text-align: center;">The Saviour System</h2>
        <p style="color: #475569;">Your OTP verification code:</p>
        <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 10px 20px; border-radius: 8px;">{otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 The Saviour System. All rights reserved.</p>
    </div>
    """, subtype="html")

    # Always print OTP to logs for debugging
    print(f"🔑 OTP GENERATED for {email}: {otp}")
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASS)
            server.send_message(msg)
        print(f"✅ OTP email sent successfully to {email}")
    except Exception as e:
        print(f"❌ Email FAILED for {email}: {type(e).__name__}: {e}")
        print(f"💡 USE THIS OTP MANUALLY: {otp}")

# --- Routes ---
@app.get("/health")
async def health():
    return {"status": "ok", "db": "connected" if db else "not connected"}

@app.get("/")
async def index(request: Request):
    try:
        return templates.TemplateResponse(
            "index.html",
            {"request": request}
        )
    except Exception as e:
        return {"message": "Guardian AI Registration System is running", "error": str(e)}

@app.post("/api/v1/auth/register")
async def register(user: UserRegister, background_tasks: BackgroundTasks):
    # Check if email already exists in MongoDB
    if db:
        existing = await db.users.find_one({"email": user.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    elif user.email in pending_users:
        raise HTTPException(status_code=400, detail="Registration already in progress for this email")

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Hash password
    hashed_password = pwd_context.hash(user.password)

    # Store in pending storage (expires in 10 mins)
    pending_users[user.email] = {
        "fullname": user.fullname,
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "otp": otp,
        "expires_at": datetime.now() + timedelta(minutes=10)
    }

    # Send OTP email in background
    background_tasks.add_task(send_otp_email, user.email, otp)

    return {"message": "OTP sent to email"}

@app.post("/api/v1/auth/verify-otp")
async def verify_otp(data: OTPVerify):
    email = data.email
    otp = data.otp

    if email not in pending_users:
        raise HTTPException(status_code=400, detail="Session expired or not found. Please register again.")

    user_info = pending_users[email]

    if user_info["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now() > user_info["expires_at"]:
        del pending_users[email]
        raise HTTPException(status_code=400, detail="OTP expired. Please resend.")

    # Save to MongoDB
    if db:
        await db.users.insert_one({
            "fullname": user_info["fullname"],
            "username": user_info["username"],
            "email": user_info["email"],
            "password": user_info["password"],
            "role": user_info["role"],
            "created_at": datetime.now().isoformat()
        })
        print(f"✅ User {email} saved to MongoDB")
    else:
        print(f"⚠️ No DB: User {email} registered in memory only (not persistent)")

    del pending_users[email]

    return {"message": "User verified and registered successfully"}

@app.post("/api/v1/auth/resend-otp")
async def resend_otp(data: ResendOTP, background_tasks: BackgroundTasks):
    email = data.email

    if email not in pending_users:
        raise HTTPException(status_code=400, detail="Registration session not found. Please register again.")

    otp = str(random.randint(100000, 999999))
    pending_users[email]["otp"] = otp
    pending_users[email]["expires_at"] = datetime.now() + timedelta(minutes=10)

    background_tasks.add_task(send_otp_email, email, otp)

    return {"message": "New OTP sent"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
