# FastAPI Registration System with Email OTP Verification

This is a premium, secure registration system built with FastAPI (Python) and a modern Glassmorphism UI.

## Features
- **Modern UI**: Stylish animations, glassmorphism, and responsive design.
- **OTP Verification**: Secure 6-digit OTP sent via Gmail SMTP.
- **Security**: Password hashing with `bcrypt`, duplicate email checking, and OTP expiry.
- **Interactive**: Password show/hide, resend OTP timer, and loading states.
- **Database**: Simple and efficient `users.json` storage.

---

## 🛠 Prerequisites

Before running the project, you need:
1. **Python 3.8+** installed.
2. **Gmail App Password**:
   - Go to your [Google Account Settings](https://myaccount.google.com/).
   - Enable **2-Step Verification**.
   - Search for **App Passwords**.
   - Create a new one (select "Other") and copy the **16-character code**.

---

## 🚀 Installation & Setup

### 1. Install Dependencies
Open your terminal and run:
```bash
pip install fastapi uvicorn passlib bcrypt jinja2 python-multipart pydantic[email]
```

### 2. Configure Email
Open `main.py` and update these lines with your details:
```python
GMAIL_USER = "your-email@gmail.com"
GMAIL_APP_PASS = "your-app-password"  # The 16-character code
```

---

## 🏃 How to Run

1. Navigate to the project directory:
   ```bash
   cd fastapi-registration-system
   ```

2. Start the server:
   ```bash
   python main.py
   ```

3. Open your browser and go to:
   [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 📂 Project Structure
```
fastapi-registration-system/
├── main.py              # FastAPI Backend logic
├── users.json           # Local database (created automatically)
├── static/
│   └── style.css        # Premium CSS styling
└── templates/
    └── index.html       # HTML, JS & UI structure
```

## 🔒 Security Notes
- Passwords are never stored in plain text.
- OTPs are stored in-memory and expire after 10 minutes.
- Background tasks ensure the UI remains fast even while sending emails.
