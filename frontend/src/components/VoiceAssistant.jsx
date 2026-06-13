import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getTranslation } from "../utils/i18n";
import { speakText } from "../utils/tts";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Mic, X, AlertTriangle, CheckCircle, Volume2 } from "lucide-react";

export const VoiceAssistant = ({ onClose, onCustomerAdded }) => {
  const { user } = useAuth();
  const currentLang = user?.language || "english";
  const navigate = useNavigate();

  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, recording, processing, success, error, confirmation
  const [resultMsg, setResultMsg] = useState("");
  const [transcript, setTranscript] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAndParseAudio(audioBlob);
      };

      recorder.start();
      setRecording(true);
      setStatus("recording");
      speakText(getTranslation(currentLang, "speakNow"), currentLang);
    } catch (err) {
      console.error("Microphone access denied:", err.message);
      setStatus("error");
      setResultMsg("Microphone permission denied. Please allow microhphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setStatus("processing");
    }
  };

  const uploadAndParseAudio = async (audioBlob) => {
    setProcessing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "command.webm");

    try {
      const res = await api.post("/voice/parse", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const data = res.data;
      setTranscript(data.transcript || "");
      console.log("Voice parse response:", data);

      if (data.status === "SUCCESS") {
        setStatus("success");
        setResultMsg(data.message);
        speakText(data.message, currentLang);
        
        // Trigger page reloads or update ledger view
        setTimeout(() => {
          onClose();
          if (data.parsedData?.customerId) {
            navigate(`/customer/${data.parsedData.customerId}`);
          } else {
            window.location.reload();
          }
        }, 3000);
      } else if (data.status === "NAVIGATE") {
        const { intent, customerId } = data.parsedData;
        
        if (intent === "VIEW_PROFILE" && customerId) {
          setStatus("success");
          setResultMsg(`Opening profile for ${data.parsedData.customerName}...`);
          speakText(`Opening profile for ${data.parsedData.customerName}`, currentLang);
          setTimeout(() => {
            onClose();
            navigate(`/customer/${customerId}`);
          }, 1500);
        } else if (intent === "CHECK_BALANCE" && customerId) {
          setStatus("success");
          setResultMsg(`Navigating to customer balance...`);
          setTimeout(() => {
            onClose();
            navigate(`/customer/${customerId}?action=speak-balance`);
          }, 1500);
        } else if (intent === "NAVIGATE_DASHBOARD") {
          setStatus("success");
          setResultMsg(`Going back to dashboard home...`);
          speakText(`Going to home dashboard`, currentLang);
          setTimeout(() => {
            onClose();
            navigate("/");
          }, 1500);
        } else if (intent === "ADD_CUSTOMER") {
          setStatus("success");
          setResultMsg(`Opening new customer registration screen...`);
          speakText(`Opening new customer screen`, currentLang);
          setTimeout(() => {
            onClose();
            if (onCustomerAdded) onCustomerAdded(); // trigger add customer modal open
          }, 1500);
        } else {
          setStatus("error");
          setResultMsg(`Parsed voice command: "${data.transcript}". I couldn't map this to a Kirana action.`);
          speakText("Command not recognized", currentLang);
        }
      } else if (data.status === "NEED_CONFIRMATION" || data.status === "NOT_FOUND") {
        setStatus("confirmation");
        setResultMsg(data.message);
        speakText(data.message, currentLang);
      }
    } catch (err) {
      console.error("Audio parsing failed:", err);
      setStatus("error");
      setResultMsg(err.response?.data?.message || "Failed to process voice command. Please try again.");
      speakText("Voice processing failed", currentLang);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/40 backdrop-blur-md p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-purple-100 shadow-2xl p-6 text-center relative slide-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-purple-950 transition p-1.5 rounded-full hover:bg-purple-50"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-extrabold text-purple-950 mb-1 mt-2">
          {getTranslation(currentLang, "voiceAssistant")}
        </h3>
        <p className="text-xs text-purple-500 font-medium mb-6">
          {getTranslation(currentLang, "voiceTip")}
        </p>

        <div className="my-8 flex flex-col items-center justify-center">
          {status === "idle" && (
            <button
              onClick={startRecording}
              className="w-24 h-24 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-200 transition active:scale-95 cursor-pointer"
            >
              <Mic className="w-10 h-10" />
            </button>
          )}

          {status === "recording" && (
            <div className="flex flex-col items-center">
              {/* Mic Wave Animation */}
              <div className="flex items-center gap-1.5 h-12 mb-6">
                <span className="w-1.5 bg-purple-600 rounded-full wave-bar h-8" />
                <span className="w-1.5 bg-purple-500 rounded-full wave-bar h-12" />
                <span className="w-1.5 bg-purple-600 rounded-full wave-bar h-10" />
                <span className="w-1.5 bg-purple-500 rounded-full wave-bar h-12" />
                <span className="w-1.5 bg-purple-600 rounded-full wave-bar h-8" />
              </div>
              
              <button
                onClick={stopRecording}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
              >
                Stop & Process
              </button>
            </div>
          )}

          {status === "processing" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-purple-600">Whispering & Parsing with AI...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="w-16 h-16 text-emerald-500 animate-bounce" />
              <p className="text-sm font-bold text-emerald-600 mt-2">{resultMsg}</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-2">
              <AlertTriangle className="w-16 h-16 text-red-500" />
              <p className="text-sm font-semibold text-red-600 mt-2">{resultMsg}</p>
              <button
                onClick={startRecording}
                className="mt-4 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-md text-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {status === "confirmation" && (
            <div className="flex flex-col items-center space-y-2">
              <AlertTriangle className="w-16 h-16 text-yellow-500" />
              <p className="text-sm font-bold text-yellow-600 mt-2">{resultMsg}</p>
              {transcript && (
                <p className="text-xs text-purple-700 font-semibold italic mt-1 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                  Heard: "{transcript}"
                </p>
              )}
              <button
                onClick={startRecording}
                className="mt-4 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-md text-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {transcript && status !== "confirmation" && (
          <div className="mt-4 bg-purple-50/50 border border-purple-100 rounded-2xl p-3 text-left">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Transcription</span>
            <p className="text-sm font-semibold text-purple-900 leading-snug">"{transcript}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
