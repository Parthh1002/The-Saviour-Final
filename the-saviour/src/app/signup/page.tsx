"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShieldCheck, Mail, Lock, User, ArrowRight, Building, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "otp" | "success">("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Registration failed");

      setEmail(formData.email);
      setStep("otp");
      setTimer(60);
    } catch (err: any) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(`Cannot connect to backend server at ${API_BASE_URL}. The service may be starting up, please try again in a moment.`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join("") }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Invalid OTP");

      setStep("success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setTimer(60);
    } catch (err) {
      setError("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center glass p-8 rounded-2xl animate-fade-in">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Verified!</h1>
          <p className="text-secondary mb-8">Your account access has been approved and verified. You can now sign in.</p>
          <button 
            onClick={() => router.push("/login")}
            className="w-full bg-accent text-white py-3 rounded-lg font-medium shadow-[var(--shadow-glow-blue)] hover:bg-accent/90 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/10 mb-4 shadow-[var(--shadow-glow-blue)]">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {step === "register" ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-secondary text-sm">
            {step === "register" 
              ? "Join the network to protect wildlife with AI." 
              : `We sent a code to ${email}`}
          </p>
        </div>

        <div className="glass p-8 rounded-2xl animate-fade-in">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {step === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
                  <input 
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    type="text" 
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent transition-all"
                    placeholder="Officer Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Username</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
                  <input 
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    type="text" 
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent transition-all"
                    placeholder="username_officer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
                  <input 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email" 
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent transition-all"
                    placeholder="officer@saviour.ai"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
                  <input 
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    type="password" 
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-accent text-white py-2.5 rounded-lg font-medium shadow-[var(--shadow-glow-blue)] hover:bg-accent/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Register"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none"
                    required
                  />
                ))}
              </div>

              <button 
                type="submit" 
                disabled={loading || otp.some(d => !d)}
                className="w-full bg-accent text-white py-3 rounded-lg font-medium shadow-[var(--shadow-glow-blue)] hover:bg-accent/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Complete"}
              </button>

              <div className="text-center text-sm text-secondary">
                Didn't receive the code?{" "}
                <button 
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timer > 0 || loading}
                  className="text-accent font-medium hover:underline disabled:opacity-50"
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend Now"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-secondary">
            Already have access? <Link href="/login" className="text-accent font-medium hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
