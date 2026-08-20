import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { tabulaStore } from "../lib/store";
import { supabase } from "../lib/supabase";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot/Reset password states
  const [resetCodeInput, setResetCodeInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken || !supabase) return;

    void supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setErrorMsg("This password reset link is invalid or expired.");
          return;
        }
        setHasRecoverySession(true);
        setMode("reset");
        window.history.replaceState({}, document.title, "/login");
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The authentication service is unavailable. Check the Vercel server configuration.");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Sync user into store
      tabulaStore.setCurrentUser(data.user);
      tabulaStore.setApiToken(data.token || null);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The password recovery service is unavailable.");
      }

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Failed to dispatch password reset request.",
        );
      }

      setSuccessMsg(data.message);
      setMode("login");
    } catch (err: any) {
      setErrorMsg(
        err.message || "An error occurred during password reset request.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (hasRecoverySession && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
        if (error) throw new Error(error.message);
      } else {
        throw new Error("Open the password reset email before choosing a new password.");
      }

      setSuccessMsg(
        "Your password has been successfully reset! You can now log in.",
      );
      setMode("login");
      setPassword(newPasswordInput);
    } catch (err: any) {
      setErrorMsg(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 font-sans text-white selection:bg-[#E2FF00] selection:text-black">
      <div className="max-w-md w-full bg-[#141414] border border-white/10 p-8 space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#E2FF00] text-black font-black flex items-center justify-center text-xl mx-auto">
            T
          </div>
          <h1 className="display-type text-2xl text-white uppercase tracking-tight">
            TABULA CONSOLE
          </h1>
          <p className="micro-label text-[#888888]">
            Tabulation & Survey Research System
          </p>
        </div>

        {/* Banners */}
        {errorMsg && (
          <div className="p-3 bg-[#FF4D4D]/15 border border-[#FF4D4D]/30 text-[#FF8080] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-[#E2FF00]/10 border border-[#E2FF00]/30 text-[#E2FF00] text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="micro-label block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-[#1C1C1C] border border-white/10 text-white focus:outline-none focus:border-[#E2FF00] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="micro-label">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-[11px] text-[#E2FF00] hover:underline font-bold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-[#1C1C1C] border border-white/10 text-white focus:outline-none focus:border-[#E2FF00] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#E2FF00] hover:bg-[#CBE600] text-black font-black uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN TO CONSOLE"}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
            <div className="space-y-1">
              <h2 className="display-type text-lg text-white">
                RESET PASSWORD
              </h2>
              <p className="text-[#A0A0A0] text-xs">
                Enter your account email address to receive a password reset
                verification code.
              </p>
            </div>

            <div>
              <label className="micro-label block mb-1">Account Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-[#1C1C1C] border border-white/10 text-white focus:outline-none focus:border-[#E2FF00]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="flex-1 h-10 bg-[#1C1C1C] hover:bg-[#252525] text-white border border-white/10 font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-10 bg-[#E2FF00] hover:bg-[#CBE600] text-black font-black uppercase tracking-wider transition-colors"
              >
                {loading ? "SENDING..." : "SEND CODE"}
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="space-y-1">
              <h2 className="display-type text-lg text-white">
                ENTER VERIFICATION CODE
              </h2>
              <p className="text-[#A0A0A0] text-xs">
                Enter the verification code dispatched to{" "}
                <strong className="text-white">{email}</strong> and set your new
                password.
              </p>
            </div>

            <div>
              <label className="micro-label block mb-1">
                Reset Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. A1B2C3D4"
                  value={resetCodeInput}
                  onChange={(e) => setResetCodeInput(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-[#1C1C1C] border border-white/10 text-white font-mono focus:outline-none focus:border-[#E2FF00]"
                />
              </div>
            </div>

            <div>
              <label className="micro-label block mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-[#1C1C1C] border border-white/10 text-white focus:outline-none focus:border-[#E2FF00]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="flex-1 h-10 bg-[#1C1C1C] hover:bg-[#252525] text-white border border-white/10 font-bold uppercase tracking-wider transition-colors"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-10 bg-[#E2FF00] hover:bg-[#CBE600] text-black font-black uppercase tracking-wider transition-colors"
              >
                {loading ? "RESETTING..." : "UPDATE PASSWORD"}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 text-center micro-label text-[#888]">
          <p>Organization account sign-in</p>
        </div>
      </div>
    </div>
  );
};
