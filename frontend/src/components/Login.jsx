import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTranslation } from "../utils/i18n";
import { speakText } from "../utils/tts";
import Header from "../components/Header";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Phone, Lock, AlertCircle } from "lucide-react";

export const Login = () => {
  const { login, user } = useAuth();
  const currentLang = user?.language || "english";
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await login(phone, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid credentials");
      speakText(err.message || "Invalid credentials", currentLang);
    } finally {
      setSubmitting(false);
    }
  };

  const loginExplain = `Welcome to Udhaar Khata. Please log in using your ten-digit mobile number and secure password. You can switch your preferred language in the top menu.`;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-slate-100 to-indigo-50">
      <Header titleExplain={loginExplain} />
      
      <div className="flex-1 flex items-center justify-center p-6 slide-up">
        <div className="w-full max-w-md bg-white rounded-3xl border border-purple-100 shadow-xl overflow-hidden p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-purple-950">
              {getTranslation(currentLang, "login")}
            </h2>
            <p className="text-sm text-purple-600 mt-2 font-medium">
              Manage credit ledger for your Kirana shop
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-purple-950 mb-2">
                {getTranslation(currentLang, "phone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="number"
                  placeholder="E.g., 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-2xl outline-none font-semibold text-purple-950 placeholder-purple-300 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-purple-950 mb-2">
                {getTranslation(currentLang, "password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-2xl outline-none font-semibold text-purple-950 placeholder-purple-300 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 active:scale-95 duration-100 transition shadow-lg shadow-purple-200 glow-primary cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              <span>{submitting ? "Logging in..." : getTranslation(currentLang, "login")}</span>
            </button>
          </form>

          <div className="mt-8 text-center border-t border-purple-50 pt-6">
            <p className="text-sm text-purple-950 font-medium">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-600 font-extrabold hover:underline">
                Register shop
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
