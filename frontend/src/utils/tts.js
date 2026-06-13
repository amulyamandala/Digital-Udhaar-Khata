// Text-To-Speech service utilizing browser SpeechSynthesis API
export const speakText = (text, language = "english") => {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("Speech Synthesis is not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Map our language strings to standard voice BCP 47 codes
  const langCodes = {
    english: "en-IN", // Indian English voice preferred
    hindi: "hi-IN",
    telugu: "te-IN",
    tamil: "ta-IN"
  };

  const code = langCodes[language.toLowerCase()] || "en-IN";
  utterance.lang = code;

  // Retrieve voices and select one that matches the language code
  let voices = window.speechSynthesis.getVoices();
  
  const selectVoice = () => {
    voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang === code || v.lang.startsWith(code));
    
    // Fallback search
    if (!selectedVoice) {
      if (code === "hi-IN") selectedVoice = voices.find(v => v.lang.includes("hi"));
      else if (code === "te-IN") selectedVoice = voices.find(v => v.lang.includes("te"));
      else if (code === "ta-IN") selectedVoice = voices.find(v => v.lang.includes("ta"));
      else selectedVoice = voices.find(v => v.lang.includes("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Adjust speed for readability by local shop owners
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  if (voices.length === 0) {
    // Voices are loaded asynchronously in Chrome/Edge, listen for changes
    window.speechSynthesis.onvoiceschanged = selectVoice;
  } else {
    selectVoice();
  }
};
