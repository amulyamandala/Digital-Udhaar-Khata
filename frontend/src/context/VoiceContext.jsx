import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled(prev => {
      const newState = !prev;
      if (!newState) {
        window.speechSynthesis.cancel();
      }
      return newState;
    });
  }, []);

  useEffect(() => {
    if (!isVoiceEnabled) return;

    let hoverTimeout;

    const handleMouseOver = (e) => {
      const target = e.target;
      
      // Only read text-heavy elements
      const validTags = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TH', 'TD', 'A', 'BUTTON', 'LABEL', 'LI', 'STRONG', 'B', 'I', 'EM'];
      if (!validTags.includes(target.tagName)) return;

      const text = target.innerText || target.textContent;
      if (!text || text.trim().length === 0) return;

      // Small delay to prevent spamming when dragging mouse across screen
      hoverTimeout = setTimeout(() => {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text.trim());
        const lang = localStorage.getItem('selectedLanguage') || 'en';
        
        // Map app language to speech language
        const langMap = {
          'en': 'en-IN',
          'hi': 'hi-IN',
          'te': 'te-IN',
          'ta': 'ta-IN'
        };
        
        utterance.lang = langMap[lang] || 'en-IN';
        utterance.rate = 0.9;
        
        window.speechSynthesis.speak(utterance);
      }, 500); // 500ms hover required
    };

    const handleMouseOut = () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimeout) clearTimeout(hoverTimeout);
      window.speechSynthesis.cancel();
    };
  }, [isVoiceEnabled]);

  return (
    <VoiceContext.Provider value={{ isVoiceEnabled, toggleVoice }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
};
