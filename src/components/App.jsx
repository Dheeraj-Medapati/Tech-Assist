import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import "./style.css"; // Import CSS file

function App() {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null); // Reference for auto-scrolling

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setInput("");

    // Mock AI response after delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "This is a response from AI!", sender: "bot" },
      ]);
    }, 1000);
  };

  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <div className="chat-box" ref={chatBoxRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="input-box">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button onClick={sendMessage} className="send-button">
            <Send size={20} />
          </button>
        </div>
      </div>
      <div className="pon"> Teacher bot can make mistakes</div>
    </div>
  );
}

export default App;
