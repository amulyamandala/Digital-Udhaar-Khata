import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTranslation } from "../utils/i18n";
import { speakText } from "../utils/tts";
import Header from "../components/Header";
import { Link, useNavigate } from "react-router-dom";
import { Store, User, Phone, Lock, Sparkles, Check } from "lucide-react";

export const Register = () => {
  const { register, user } = useAuth();
  const currentLang = user?.language || "english";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [password, setPassword] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !shopName || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await register({
        name,
        phone: Number(phone),
        shopName,
        password,
        subscriptionPlan,
        language: currentLang
      });
      speakText("Registration successful. Please log in.", currentLang);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
      speakText(err.message || "Registration failed", currentLang);
    } finally {
      setSubmitting(false);
    }
  };

  const registerExplain = `Create your digital ledger account. Enter your name, ten-digit mobile number, shop name, and set a password. Select a subscription plan: free or premium.`;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-slate-100 to-indigo-50">
      <Header titleExplain={registerExplain} />
      
      <div className="flex-grow flex items-center justify-center p-6 slide-up">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-purple-100 shadow-xl overflow-hidden p-8 my-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-purple-950">
              {getTranslation(currentLang, "register")}
            </h2>
            <p className="text-sm text-purple-600 mt-2 font-medium">
              Join thousands of Kirana stores going digital
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold flex gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-purple-950 mb-1.5">
                {getTranslation(currentLang, "ownerName")}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  placeholder="E.g., Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-2xl outline-none font-semibold text-purple-950 placeholder-purple-300 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-purple-950 mb-1.5">
                {getTranslation(currentLang, "phone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="number"
                  placeholder="E.g., 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-2xl outline-none font-semibold text-purple-950 placeholder-purple-300 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-purple-950 mb-1.5">
                {getTranslation(currentLang, "shopName")}
              </label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  placeholder="E.g., Rajesh Kirana Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-2xl outline-none font-semibold text-purple-950 placeholder-purple-300 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-purple-950 mb-1.5">
                {getTranslation(currentLang, "password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-2xl outline-none font-semibold text-purple-950 placeholder-purple-300 transition-all"
                  required
                />
              </div>
            </div>

            {/* Subscription plans selector */}
            <div>
              <label className="block text-sm font-bold text-purple-950 mb-3">
                {getTranslation(currentLang, "subscription")}
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Free plan */}
                <div
                  onClick={() => setSubscriptionPlan("free")}
                  className={`p-4 border-2 rounded-2xl cursor-pointer flex flex-col justify-between transition-all select-none ${
                    subscriptionPlan === "free"
                      ? "border-purple-600 bg-purple-50/50 shadow-md"
                      : "border-purple-100 hover:border-purple-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-purple-950">Free Plan</span>
                    {subscriptionPlan === "free" && (
                      <div className="bg-purple-600 text-white rounded-full p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-purple-500 font-semibold mt-2">Basic Ledger & PDF statements</span>
                </div>

                {/* Premium plan */}
                <div
                  onClick={() => setSubscriptionPlan("premium")}
                  className={`p-4 border-2 rounded-2xl cursor-pointer flex flex-col justify-between transition-all relative select-none ${
                    subscriptionPlan === "premium"
                      ? "border-purple-600 bg-purple-50/50 shadow-md"
                      : "border-purple-100 hover:border-purple-200"
                  }`}
                >
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" />
                    PRO
                  </div>
                  <div className="flex justify-between items-start pr-8">
                    <span className="font-extrabold text-purple-950">Premium Plan</span>
                    {subscriptionPlan === "premium" && (
                      <div className="bg-purple-600 text-white rounded-full p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-purple-500 font-semibold mt-2">Voice control, AI reminders, WhatsApp bot</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 active:scale-95 duration-100 transition shadow-lg shadow-purple-200 glow-primary cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>{submitting ? "Registering..." : getTranslation(currentLang, "register")}</span>
            </button>
          </form>

          <div className="mt-8 text-center border-t border-purple-50 pt-6">
            <p className="text-sm text-purple-950 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 font-extrabold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
