import React from "react";
import { useAuth } from "../context/AuthContext";
import { getTranslation } from "../utils/i18n";
import { speakText } from "../utils/tts";
import { LogOut, Volume2, Globe, Shop } from "lucide-react";

export const Header = ({ titleExplain }) => {
  const { user, logout, changeLanguage } = useAuth();
  const currentLang = user?.language || "english";

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  const handleReadAloud = () => {
    if (titleExplain) {
      speakText(titleExplain, currentLang);
    }
  };

  return (
    <header className="glass sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between shadow-sm border-b border-purple-100 rounded-b-2xl">
      <div className="flex items-center gap-3">
        <div className="bg-purple-600 text-white p-2 rounded-xl shadow-md">
          <Shop className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-purple-950 tracking-tight m-0 select-none">
            {user?.shopName || "Udhaar Khata"}
          </h1>
          {user && (
            <p className="text-xs text-purple-600 font-medium leading-none mt-0.5">
              {getTranslation(currentLang, "ownerName")}: {user.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Read Out Loud Mode Button */}
        {titleExplain && (
          <button
            onClick={handleReadAloud}
            className="flex items-center justify-center p-2.5 rounded-xl border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition shadow-sm"
            title={getTranslation(currentLang, "readOutLoud")}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        )}

        {/* Global Language Selector */}
        <div className="relative flex items-center gap-1.5 px-3 py-2 border border-purple-200 bg-white rounded-xl shadow-sm text-sm font-semibold text-purple-900">
          <Globe className="w-4 h-4 text-purple-500" />
          <select
            value={currentLang}
            onChange={handleLanguageChange}
            className="bg-transparent border-none outline-none cursor-pointer pr-1"
          >
            <option value="english">English</option>
            <option value="hindi">हिन्दी (Hindi)</option>
            <option value="telugu">తెలుగు (Telugu)</option>
            <option value="tamil">தமிழ் (Tamil)</option>
          </select>
        </div>

        {/* Logout */}
        {user?._id && (
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition shadow-sm text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{getTranslation(currentLang, "logout")}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;