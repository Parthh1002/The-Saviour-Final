"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-warning/10 mb-4 shadow-[var(--shadow-glow)]">
            <ShieldCheck className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-secondary text-sm">Enter your officer email to receive reset instructions.</p>
        </div>

        <div className="glass p-8 rounded-2xl animate-fade-in" style={{ animationDelay: "100ms" }}>
          {!submitted ? (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-warning focus:border-transparent transition-all"
                    placeholder="admin@saviour.ai"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-warning text-white py-2.5 rounded-lg font-medium shadow-sm hover:bg-warning/90 transition-all flex items-center justify-center gap-2 group mt-2"
              >
                Send Reset Link
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="h-12 w-12 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Check your email</h3>
              <p className="text-secondary text-sm mb-6">We have sent password recovery instructions to {email}</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-primary hover:underline text-sm font-medium"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-secondary">
            Remembered your password? <Link href="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
