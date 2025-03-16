import { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon } from "lucide-react";
import "./style.css"; // Import CSS file

function App() {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't process that.";

      setMessages((prev) => [...prev, { text: reply, sender: "bot" }]);
    } catch (error) {
      console.error("API error:", error);
      setMessages((prev) => [...prev, { text: "Error: Unable to fetch response.", sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  const sendImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setMessages((prev) => [...prev, { image: URL.createObjectURL(file), sender: "user" }]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("http://localhost:3001/api/gemini/image", { method: "POST", body: formData });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't process the image.";

      setMessages((prev) => [...prev, { text: reply, sender: "bot" }]);
    } catch (error) {
      console.error("Image processing error:", error);
      setMessages((prev) => [...prev, { text: "Error processing image", sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatBoxRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <div className="chat-box" ref={chatBoxRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text && <p>{msg.text}</p>}
              {msg.image && <img src={msg.image} alt="Uploaded" className="chat-image" />}
            </div>
          ))}
          {loading && <div className="message bot">Loading...</div>}
        </div>
        <div className="input-box">
          <input type="file" accept="image/*" onChange={sendImage} style={{ display: "none" }} id="image-upload" />
          <label htmlFor="image-upload" className="icon-button">
            <ImageIcon size={20} />
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button onClick={sendMessage} className="send-button">
            <Send size={20} />
          </button>
        </div>
      </div>
      <div className="pon">Teacher bot can make mistakes</div>
    </div>
  );
}

export default App;
