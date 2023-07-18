import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const chat = async (e, message) => {
    e.preventDefault();

    if (!message) return;
    setIsTyping(true);
    scrollTo(0, 1e10);

    let msgs = chats;
    msgs.push({ role: "user", content: message });
    setChats(msgs);

    setMessage("");

    fetch("http://localhost:8000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chats,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        msgs.push(data.output);
        setChats(msgs);
        setIsTyping(false);
        scrollTo(0, 1e10);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <main>
      <h1> Arrhythmia Chatbot</h1>

      <section>
        {chats && chats.length
          ? chats.map((chat, index) => (
              <p
                key={index}
                className={`message ${chat.role === "user" ? "user_msg" : "api_msg"}`}
              >
                <span>{chat.content}</span>
              </p>
            ))
          : ""}
      </section>
  
      <div className={isTyping ? "" : "hide"}>
        <p>
          <i>{isTyping ? "Typing" : ""}</i>
        </p>
      </div>
  
      <form onSubmit={(e) => chat(e, message)}>
        <input
          type="text"
          name="message"
          value={message}
          placeholder="Type a message here and hit Enter..."
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit"> ➤ </button>
      </form>
    </main>
  );
  
}

export default App;
