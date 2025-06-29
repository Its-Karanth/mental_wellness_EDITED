import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your AI wellness assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      (messagesEndRef.current as any).scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, typingIndicator]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = { 
      sender: "user", 
      text: input,
      timestamp: new Date()
    };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput("");
    setLoading(true);
    setTypingIndicator(true);
    
    // Simulate typing delay for more natural feel
    setTimeout(() => {
      setTypingIndicator(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
    
    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        message: input,
        user: user?.id, // send MongoDB _id
      });
      
      const botMessage = { 
        sender: "bot", 
        text: res.data.reply,
        timestamp: new Date()
      };
      setMessages((msgs) => [...msgs, botMessage]);
    } catch {
      const errorMessage = { 
        sender: "bot", 
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages((msgs) => [...msgs, errorMessage]);
    } finally {
      setLoading(false);
      setTypingIndicator(false);
    }
  };

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/history/${user.id}`
        );
        if (res.data.messages && res.data.messages.length > 0) {
          // Add timestamps to historical messages if they don't have them
          const messagesWithTimestamps = res.data.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }));
          setMessages(messagesWithTimestamps);
        }
      } catch {
        // ignore
      }
    };
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRandomTypingText = () => {
    const typingTexts = [
      "Thinking...",
      "Processing...",
      "Analyzing...",
      "Reflecting...",
      "Considering..."
    ];
    return typingTexts[Math.floor(Math.random() * typingTexts.length)];
  };

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <div className="card shadow-sm mb-3">
        <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
          <span>AI Wellness Chatbot</span>
          <small className="text-light">Always here to help</small>
        </div>
        <div
          className="card-body"
          style={{ height: 400, overflowY: "auto", background: "#f8f9fa" }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`d-flex mb-3 ${
                msg.sender === "user"
                  ? "justify-content-end"
                  : "justify-content-start"
              }`}
            >
              <div
                className={`p-3 rounded position-relative ${
                  msg.sender === "user"
                    ? "bg-primary text-white"
                    : "bg-light border"
                }`}
                style={{ 
                  maxWidth: "75%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
              >
                <div className="mb-1">{msg.text}</div>
                <small 
                  className={`${
                    msg.sender === "user" ? "text-light" : "text-muted"
                  }`}
                  style={{ fontSize: "0.7rem" }}
                >
                  {formatTime(msg.timestamp)}
                </small>
              </div>
            </div>
          ))}
          
          {typingIndicator && (
            <div className="d-flex mb-3 justify-content-start">
              <div
                className="p-3 rounded bg-light border"
                style={{ maxWidth: "75%" }}
              >
                <div className="d-flex align-items-center">
                  <div className="typing-indicator me-2">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <small className="text-muted">{getRandomTypingText()}</small>
                </div>
              </div>
            </div>
          )}
          
          {loading && !typingIndicator && (
            <div className="d-flex mb-3 justify-content-start">
              <div
                className="p-3 rounded bg-light border"
                style={{ maxWidth: "75%" }}
              >
                <div className="text-muted">Sending message...</div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={sendMessage}
          className="card-footer d-flex gap-2 bg-white"
        >
          <input
            type="text"
            className="form-control"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || typingIndicator}
            autoFocus
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || typingIndicator || !input.trim()}
          >
            {loading || typingIndicator ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
      
      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #6c757d;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
