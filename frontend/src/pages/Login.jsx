import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ username });
  };

  return (
    <div className="bg-[#131313] text-[#e2e2e2] min-h-screen flex flex-col items-center justify-center p-6 md:p-10 font-body antialiased">
      <main className="w-full max-w-md mx-auto flex flex-col items-center gap-10 animate-fade-in-up">
        {/* Brand Identity */}
        <header className="text-center flex flex-col items-center gap-4 w-full">
          {/* Logo */}
          <div className="relative group">
            <img
              src="/logo.png"
              alt="Malaabis Studio"
              className="h-44 w-auto object-contain drop-shadow-[0_0_32px_rgba(212,175,55,0.5)] transition-transform duration-700 group-hover:scale-110 animate-pulse-slow"
              onError={(e) => {
                e.target.style.display = "none";
                document.getElementById("login-logo-fallback").style.display = "flex";
              }}
            />
            {/* Fallback */}
            <div
              id="login-logo-fallback"
              className="hidden h-24 w-24 rounded-full bg-surface-container items-center justify-center border border-primary/30 shadow-lg relative overflow-hidden mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-60" />
              <span
                className="material-symbols-outlined text-[48px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
            </div>
          </div>

          <div>
            <h1 className="font-headline text-3xl md:text-4xl text-primary tracking-widest mt-2">
              MALAABIS
            </h1>
            <p className="text-[12px] font-semibold tracking-[0.2em] text-outline mt-2 uppercase">
              STUDIO — Premium POS
            </p>
          </div>
        </header>

        {/* Login Card */}
        <section className="w-full bg-[#121212] rounded-2xl border border-outline/20 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Subtle Gold Accent Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="mb-8 text-center">
            <h2 className="font-headline text-2xl text-on-surface mb-2">Staff Login</h2>
            <p className="text-sm text-secondary">
              Authenticate to access store management.
            </p>
          </div>

          <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="relative group">
              <label
                className="absolute -top-2 left-3 bg-[#121212] px-1 text-[10px] font-semibold tracking-wider text-outline group-focus-within:text-primary transition-colors z-10"
                htmlFor="username"
              >
                USERNAME
              </label>
              <input
                className="w-full bg-[#1C1C1C] border border-[#4d4635] rounded-lg px-4 py-4 text-on-surface focus:outline-none focus:ring-0 focus:border-primary transition-colors text-sm h-[56px]"
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter staff ID or email"
                required
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/50 group-focus-within:text-primary transition-colors pointer-events-none">
                person
              </span>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <label
                className="absolute -top-2 left-3 bg-[#121212] px-1 text-[10px] font-semibold tracking-wider text-outline group-focus-within:text-primary transition-colors z-10"
                htmlFor="password"
              >
                PASSWORD
              </label>
              <input
                className="w-full bg-[#1C1C1C] border border-[#4d4635] rounded-lg px-4 py-4 text-on-surface focus:outline-none focus:ring-0 focus:border-primary transition-colors text-sm h-[56px]"
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                aria-label="Toggle password visibility"
                className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/50 hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? "visibility" : "visibility_off"}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#4d4635] bg-[#1C1C1C] text-primary focus:ring-primary focus:ring-offset-[#121212]"
                />
                <span className="text-xs text-secondary group-hover:text-on-surface transition-colors">
                  Remember me
                </span>
              </label>
              <a
                className="text-xs text-primary hover:text-primary-fixed transition-colors underline-offset-4 hover:underline"
                href="#forgot"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              className="w-full min-h-[52px] bg-primary text-black font-semibold text-xs uppercase tracking-wider rounded-lg mt-2 hover:bg-[#ffe088] active:scale-[0.98] transition-all duration-200 shadow-[0_4px_14px_0_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)] cursor-pointer"
              type="submit"
              id="login-submit-btn"
            >
              Login Securely
            </button>
          </form>
        </section>

        {/* Footer Info */}
        <footer className="text-center mt-auto pb-4">
          <p className="text-xs text-outline/50 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            Internal Access Only — Malaabis Studio POS
          </p>
        </footer>
      </main>
    </div>
  );
}