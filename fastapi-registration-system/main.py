import os
import json
import random
import smtplib
import time
from pathlib import Path
from email.message import EmailMessage
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext

# --- Configuration (Instructions for User) ---
# 1. Go to Google Account -> Security -> 2-Step Verification
# 2. At the bottom, click "App Passwords"
# 3. Create a new app (e.g., "Registration System") and copy the 16-character code
GMAIL_USER = "jhondoe.11012@gmail.com"  # REPLACE WITH YOUR GMAIL
GMAIL_APP_PASS = "sjxn yoyo pled ehvk"  # REPLACE WITH YOUR APP PASSWORD

from fastapi.middleware.cors import CORSMiddleware

# --- Setup ---
app = FastAPI(title="Guardian AI Registration System")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://the-saviour-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Use pbkdf2_sha256 for better compatibility on Windows/modern systems
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
DB_FILE = BASE_DIR / "users.json"

# In-memory temporary storage for OTP and pending user data
# In a real production app, use Redis or a temp DB table
pending_users: Dict[str, dict] = {}

# --- Models ---
class UserRegister(BaseModel):
    fullname: str
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class ResendOTP(BaseModel):
    email: EmailStr

# --- Database Utilities ---
def load_users() -> List[dict]:
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_user(user_data: dict):
    users = load_users()
    users.append(user_data)
    with open(DB_FILE, "w") as f:
        json.dump(users, f, indent=4)

# --- Email Logic ---
def send_otp_email(email: str, otp: str):
    msg = EmailMessage()
    msg["Subject"] = "Verify your The Saviour Account"
    msg["From"] = GMAIL_USER
    msg["To"] = email
    
    msg.set_content(f"""
    Hi there!
    
    Thank you for registering with The Saviour.
    Your 6-digit verification code is: {otp}
    
    This code will expire in 10 minutes.
    
    If you didn't request this, please ignore this email.
    """)
    
    # Optional: HTML content for a prettier email
    msg.add_alternative(f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #6366f1; text-align: center;">The Saviour Verification</h2>
        <p>Hi there!</p>
        <p>Thank you for registering with The Saviour. Please use the following One-Time Password (OTP) to verify your account:</p>
        <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 10px 20px; border-radius: 8px;">{otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 The Saviour System. All rights reserved.</p>
    </div>
    """, subtype="html")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASS)
            server.send_message(msg)
        print(f"✅ OTP sent successfully to {email}")
    except Exception as e:
        print(f"❌ Error sending email to {email}: {e}")
        print(f"💡 DEBUG: Your OTP for {email} is: {otp}")
        # In a real app, you might want to log this properly

# --- Routes ---
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def index(request: Request):
    try:
        # Explicitly pass request as a keyword argument to fix the 'unhashable type: dict' error
        return templates.TemplateResponse(
            request=request, 
            name="index.html", 
            context={"request": request}
        )
    except Exception as e:
        return {"error": str(e), "path": str(BASE_DIR / "templates")}

@app.post("/register")
async def register(user: UserRegister, background_tasks: BackgroundTasks):
    # Check if email already exists
    users = load_users()
    if any(u["email"] == user.email for u in users):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Hash password
    hashed_password = pwd_context.hash(user.password)
    
    # Store in pending storage (expires in 10 mins)
    pending_users[user.email] = {
        "fullname": user.fullname,
        "email": user.email,
        "password": hashed_password,
        "otp": otp,
        "expires_at": datetime.now() + timedelta(minutes=10)
    }
    
    # Send email in background to keep response fast
    background_tasks.add_task(send_otp_email, user.email, otp)
    
    return {"message": "OTP sent to email"}

@app.post("/verify-otp")
async def verify_otp(data: OTPVerify):
    email = data.email
    otp = data.otp
    
    if email not in pending_users:
        raise HTTPException(status_code=400, detail="Session expired or not found")
    
    user_info = pending_users[email]
    
    # Check if OTP matches
    if user_info["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check expiry
    if datetime.now() > user_info["expires_at"]:
        del pending_users[email]
        raise HTTPException(status_code=400, detail="OTP expired. Please resend.")
    
    # Success: Save to users.json
    save_user({
        "fullname": user_info["fullname"],
        "email": user_info["email"],
        "password": user_info["password"],
        "created_at": str(datetime.now())
    })
    
    # Clean up pending data
    del pending_users[email]
    
    return {"message": "User verified and registered successfully"}

@app.post("/resend-otp")
async def resend_otp(data: ResendOTP, background_tasks: BackgroundTasks):
    email = data.email
    
    if email not in pending_users:
        raise HTTPException(status_code=400, detail="Registration session not found")
    
    # Generate new OTP
    otp = str(random.randint(100000, 999999))
    pending_users[email]["otp"] = otp
    pending_users[email]["expires_at"] = datetime.now() + timedelta(minutes=10)
    
    background_tasks.add_task(send_otp_email, email, otp)
    
    return {"message": "New OTP sent"}

if __name__ == "__main__":
    import uvicorn
    import os
    # Render automatically sets the PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    # 0.0.0.0 allows external connections (required for Render)
    uvicorn.run(app, host="0.0.0.0", port=port)

