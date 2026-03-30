import { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import { FaMicrophone, FaStop, FaPaperPlane, FaRobot } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import "./Assistant.css";

const SUGGESTED = [
  { icon: "💊", text: "Did I take all my medicines today?" },
  { icon: "📅", text: "What medicines are due next?" },
  { icon: "📊", text: "How consistent have I been this week?" },
  { icon: "⏰", text: "Any medicines I should take before food?" },
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Hello! I'm your Memory Helper AI 🌟\nI know your medicine schedule and can answer anything about your health routine.\nTry asking me something or tap the mic to speak!",
      time: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [isVoice, setIsVoice] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const token = localStorage.getItem("token");

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        setIsVoice(true);
        setListening(false);
        // Auto send after voice
        setTimeout(() => sendMessage(transcript, true), 300);
      };

      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
      setIsVoice(true);
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-IN";
    utt.rate = 0.92;
    utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  };

  const sendMessage = async (overrideText, overrideVoice) => {
    const text = (overrideText ?? input).trim();
    const voiceFlag = overrideVoice ?? isVoice;

    if (!text || loading) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      time: new Date(),
      voice: voiceFlag,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsVoice(false);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, voice: voiceFlag }),
      });

      const data = await res.json();
      const reply = data.response || "Sorry, I couldn't understand that.";

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: reply,
        time: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Speak the reply if user used voice
      if (voiceFlag) speak(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: "Something went wrong. Please try again.",
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Layout>
      <div className="chat-page">

        {/* ── HEADER ── */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="ai-avatar">
              <BsStars />
            </div>
            <div>
              <h2 className="chat-title">Memory Helper AI</h2>
              <div className="ai-status">
                <span className="status-dot" />
                AI Assistant Active
              </div>
            </div>
          </div>
        </div>

        {/* ── SUGGESTIONS ── */}
        <div className="suggestions">
          {SUGGESTED.map((s, i) => (
            <button
              key={i}
              className="suggestion-chip"
              onClick={() => {
                setInput(s.text);
                setIsVoice(false);
                setTimeout(() => sendMessage(s.text, false), 100);
              }}
            >
              <span>{s.icon}</span> {s.text}
            </button>
          ))}
        </div>

        {/* ── MESSAGES ── */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`msg-row ${msg.role === "user" ? "msg-row--user" : "msg-row--ai"}`}
            >
              {msg.role === "ai" && (
                <div className="msg-avatar">
                  <BsStars />
                </div>
              )}

              <div className={`msg-bubble ${msg.role === "user" ? "bubble--user" : "bubble--ai"}`}>
                {msg.voice && msg.role === "user" && (
                  <span className="voice-tag">🎤 Voice</span>
                )}
                <p className="msg-text">{msg.text}</p>
                <span className="msg-time">{formatTime(msg.time)}</span>
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div className="msg-row msg-row--ai">
              <div className="msg-avatar"><BsStars /></div>
              <div className="msg-bubble bubble--ai bubble--loading">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── INPUT BAR ── */}
        <div className="chat-input-bar">
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask me anything about your medicines..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />

            <button
              className={`mic-btn ${listening ? "mic-btn--active" : ""}`}
              onClick={toggleMic}
              title={listening ? "Stop listening" : "Tap to speak"}
            >
              {listening ? <FaStop /> : <FaMicrophone />}
              {listening && <span className="mic-ring" />}
            </button>

            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <FaPaperPlane />
            </button>
          </div>

          {listening && (
            <p className="listening-label">🎤 Listening... speak now</p>
          )}
        </div>

      </div>
    </Layout>
  );
}