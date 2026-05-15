"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, Mail, Lock, ArrowRight, Activity, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSystem } from "@/components/saviour/SystemProvider";

import { API_BASE_URL } from "@/config/api";

export default function LoginPage() {
  const { setOfficerInfo, playNotify, audioEnabled, setAudioEnabled } = useSystem();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [reserveCode, setReserveCode] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [emailToastMsg, setEmailToastMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");
    
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", username);
        
        // Define role based on username or email
        const officerId = username.split('@')[0].toUpperCase();
        const role = officerId.startsWith('CMD') ? 'main_officer' : 'sub_officer';
        
        setOfficerInfo(role, officerId);
        playNotify();
        router.push("/dashboard");
      } else {
        setError(data.detail || "Authentication failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError("Cannot connect to server. Please ensure the backend is running.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      {error && (
        <div className="fixed top-20 right-8 bg-panel border border-danger/50 shadow-lg px-4 py-3 rounded-md flex items-center gap-3 z-50 animate-fade-in text-sm font-medium transition-all text-danger">
          <div className="h-2 w-2 rounded-full bg-danger animate-pulse"></div>
          {error}
        </div>
      )}
      {emailToastMsg && (
        <div className="fixed top-36 right-8 bg-panel border border-border shadow-lg px-4 py-3 rounded-md flex items-center gap-3 z-50 animate-fade-in text-sm font-medium transition-all">
          <Mail className="h-4 w-4 text-primary" />
          {emailToastMsg}
        </div>
      )}
      
      {/* Audio Control Toggle */}
      <button 
        onClick={() => setAudioEnabled(!audioEnabled)}
        className="fixed bottom-8 right-8 bg-panel border border-border p-3 rounded-full shadow-lg text-secondary hover:text-primary transition-all z-50"
        title={audioEnabled ? "Mute System Sounds" : "Enable System Sounds"}
      >
        {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4 shadow-[var(--shadow-glow)] relative scale-100 hover:scale-110 transition-transform">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome Back</h1>
          <p className="text-secondary text-sm mb-4">Sign in to the Saviour AI Surveillance platform.</p>
          <Link href="/" className="text-xs text-primary hover:underline flex items-center justify-center gap-1 transition-all">
            &larr; Return to Landing Page
          </Link>
        </div>

        <div className="glass p-8 rounded-2xl animate-[fade-in_0.5s_ease-out_forwards]" style={{ animationDelay: "100ms" }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="group">
              <label className="block text-sm font-medium mb-1.5 text-foreground group-focus-within:text-primary transition-colors">Officer ID (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/50"
                  placeholder="Officer Username or Email"
                  required
                />
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-foreground group-focus-within:text-primary transition-colors">Passphrase</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium mb-1.5 text-foreground group-focus-within:text-primary transition-colors">Reserve Code</label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  value={reserveCode}
                  onChange={(e) => setReserveCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/50 uppercase"
                  placeholder="ABC-045"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium shadow-[var(--shadow-glow)] hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-2"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Authenticating..." : "Sign In to Command Center"}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-secondary mb-4">Don't have an officer account?</p>
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-all group"
            >
              Register for an Account
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
