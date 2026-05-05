import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "./Layout";
import { FaMicrophone, FaStop, FaPaperPlane } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { getSelectedElderlyUser } from "../utils/caregiverContext";
import "./Assistant.css";

const SUGGESTED = [
  { icon: "Med", text: "Did I take all my medicines today?" },
  { icon: "Next", text: "What medicines are due next?" },
  { icon: "Day", text: "How am I doing today?" },
  { icon: "Food", text: "Any medicines I should take before food?" },
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Hello! I'm your Memory Helper AI.\nI can check your medicines, activities, reminders, and known visitors.\nTry asking me something or tap the mic to speak.",
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
  const selectedElderly = getSelectedElderlyUser();
  const elderId = selectedElderly?.id || null;

  useEffect(() => {
    const loadProactiveMessages = async () => {
      if (!token) return;

      try {
        const query = elderId ? `?elderId=${encodeURIComponent(elderId)}` : "";
        const res = await fetch(`http://localhost:8080/api/chat/proactive${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        const reminders = [
          ...(data.messages || []),
          ...(data.caregiverAlerts || []).map((alert) => `Caregiver alert: ${alert}`),
        ];

        if (reminders.length === 0 && data.dailySummary) {
          reminders.push(data.dailySummary);
        }

        if (reminders.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 10,
              role: "ai",
              text: reminders.join("\n"),
              time: new Date(),
              proactive: true,
            },
          ]);
        }
      } catch {
        // The assistant still works if reminders cannot be loaded.
      }
    };

    loadProactiveMessages();
  }, [token, elderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendMessage = useCallback(async (overrideText, overrideVoice) => {
    const text = (overrideText ?? input).trim();
    const voiceFlag = overrideVoice ?? isVoice;

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        text,
        time: new Date(),
        voice: voiceFlag,
      },
    ]);
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
        body: JSON.stringify({ message: text, voice: voiceFlag, elderId }),
      });

      const data = await res.json();
      const reply = data.response || "Sorry, I couldn't understand that.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: reply,
          time: new Date(),
        },
      ]);

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
  }, [input, isVoice, loading, speak, token, elderId]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsVoice(true);
      setListening(false);
      setTimeout(() => sendMessage(transcript, true), 300);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, [sendMessage]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    recognitionRef.current.start();
    setListening(true);
    setIsVoice(true);
  };

  const handleKey = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Layout>
      <div className="chat-page">
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="ai-avatar">
              <BsStars />
            </div>
            <div>
              <h2 className="chat-title">Memory Helper AI</h2>
              <div className="ai-status">
                <span className="status-dot" />
                {selectedElderly?.name ? `Caregiver AI for ${selectedElderly.name}` : "AI Assistant Active"}
              </div>
            </div>
          </div>
        </div>

        <div className="suggestions">
          {SUGGESTED.map((suggestion) => (
            <button
              key={suggestion.text}
              className="suggestion-chip"
              onClick={() => {
                setInput(suggestion.text);
                setIsVoice(false);
                setTimeout(() => sendMessage(suggestion.text, false), 100);
              }}
            >
              <span>{suggestion.icon}</span> {suggestion.text}
            </button>
          ))}
        </div>

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
                  <span className="voice-tag">Voice</span>
                )}
                {msg.proactive && msg.role === "ai" && (
                  <span className="voice-tag">Reminder</span>
                )}
                <p className="msg-text">{msg.text}</p>
                <span className="msg-time">{formatTime(msg.time)}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row msg-row--ai">
              <div className="msg-avatar">
                <BsStars />
              </div>
              <div className="msg-bubble bubble--ai bubble--loading">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask me anything about your medicines..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
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
            <p className="listening-label">Listening... speak now</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
