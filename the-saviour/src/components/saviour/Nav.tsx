"use client";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-3 backdrop-blur-xl bg-background/70 border-b border-border" : "py-6"
        }`}
    >
      <div className="mx-auto max-w-[1600px] px-12 md:px-20 flex items-center justify-between">
        {/* Left: Logo */}
        <a href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <BrandLogo />
        </a>

        {/* Center: Links */}
        <div className="hidden lg:flex items-center gap-8 text-3sm font-mono font-bold uppercase tracking-[0.2em] text-slate-500">
          <a href="#story" className="hover:text-emerald-600 transition-colors">Story</a>
          <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
          <a href="#methodology" className="hover:text-emerald-600 transition-colors">Method</a>
          <a href="#analytics" className="hover:text-emerald-600 transition-colors">Analytics</a>
          <a href="#officer" className="hover:text-emerald-600 transition-colors">Officer</a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <a
            href="/signup"
            className="hidden sm:flex items-center justify-center px-8.5 py-3 rounded-full bg-emerald-800 text-white text-3sm font-mono font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
          >
            Register
          </a>
          <a
            href="/login"
            className="flex items-center justify-center px-8.5 py-3 rounded-full border border-slate-200 text-slate-600 text-3sm font-mono font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Officer Login
          </a>
        </div>
      </div>
    </nav>
  );
}
