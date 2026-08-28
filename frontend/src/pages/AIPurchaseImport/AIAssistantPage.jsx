import React, { useState, useRef, useEffect } from "react";
import { aiAssistantService } from "../../services/aiAssistantService";

const SUGGESTIONS = [
  "Today's Sales",
  "Current Stock",
  "Low Stock Items",
  "Recent Purchases",
  "Supplier analysis",
  "Biggest sale today",
  "Show today's revenue"
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Hello! I'm your Malaabis AI Business Assistant. Ask me anything about your inventory, sales, suppliers, or purchase history."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition (STT)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputValue(transcript);
        }
      };

      rec.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Strip markdown helper for natural voice output
  const cleanSpeechText = (text) => {
    return text
      .replace(/[\*#_\-`~>]/g, "") // strip markdown
      .replace(/\s+/g, " ") // clean spacing
      .trim();
  };

  // Text-To-Speech (TTS)
  const speakText = (text) => {
    if (!isSpeechEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const cleaned = cleanSpeechText(text);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("TTS failed:", err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query || !query.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    if (!textToSend) setInputValue("");
    setLoading(true);

    try {
      const result = await aiAssistantService.askAIAssistant(query);
      setMessages((prev) => [...prev, { sender: "assistant", text: result.answer }]);
      speakText(result.answer);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: `❌ Request failed: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Voice recognition button trigger
  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported on this device/browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col h-[75vh] max-w-4xl mx-auto bg-[#121212] border border-[#4d4635]/15 rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* Assistant Header */}
      <div className="px-6 py-4 border-b border-[#4d4635]/15 bg-surface-container flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
            <span className="material-symbols-outlined animate-pulse">assistant</span>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface">Malaabis Assistant</h4>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span>
              AI Business Assistant Online
            </p>
          </div>
        </div>

        {/* TTS Toggle Switch */}
        <button
          onClick={() => {
            const nextVal = !isSpeechEnabled;
            setIsSpeechEnabled(nextVal);
            if (!nextVal) window.speechSynthesis.cancel();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            isSpeechEnabled 
              ? "bg-primary/15 text-primary border-primary/30" 
              : "bg-white/5 text-outline border-white/10"
          }`}
          title={isSpeechEnabled ? "Disable Text-To-Speech audio readouts" : "Enable Text-To-Speech audio readouts"}
        >
          <span className="material-symbols-outlined text-lg">
            {isSpeechEnabled ? "volume_up" : "volume_off"}
          </span>
        </button>
      </div>

      {/* Messages bubble body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 ${
              msg.sender === "user" 
                ? "bg-primary text-black font-semibold rounded-tr-none" 
                : "bg-surface-container border border-[#4d4635]/10 text-on-surface rounded-tl-none"
            }`}>
              {/* Parse Markdown list and bold items simple helper */}
              <div className="whitespace-pre-line">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-container border border-[#4d4635]/10 text-on-surface rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
              <span className="animate-spin material-symbols-outlined text-sm">sync</span>
              Assistant is analyzing data...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length < 3 && !loading && (
        <div className="px-6 py-2 border-t border-white/5 bg-black/10">
          <p className="text-[10px] text-outline font-bold uppercase tracking-wider mb-2">Suggested Inquiries</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#4d4635]/15 hover:border-primary/50 text-outline hover:text-primary rounded-full text-[10px] font-semibold cursor-pointer transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Panel */}
      <div className="p-4 border-t border-[#4d4635]/15 bg-surface-container">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          {/* Microphone button (STT) */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              isListening 
                ? "bg-red-500/25 border-red-500/30 text-red-400 animate-pulse" 
                : "bg-white/5 border-white/10 text-outline hover:text-white"
            }`}
            title="Ask question using voice"
          >
            <span className="material-symbols-outlined text-lg">
              {isListening ? "mic" : "mic_none"}
            </span>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Listening... Speak your inquiry" : "Ask anything about your store..."}
            className="flex-1 h-11 px-4 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
            disabled={loading}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              !inputValue.trim() || loading 
                ? "bg-white/5 text-outline cursor-not-allowed" 
                : "bg-primary text-black hover:bg-[#ffe088]"
            }`}
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>

    </div>
  );
}
