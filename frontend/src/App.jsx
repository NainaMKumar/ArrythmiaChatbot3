import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const mediaRecorderRef = useRef(null); // Reference to the MediaRecorder instance
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null); // State to store the recorded audio data
  const [audioMessages, setAudioMessages] = useState([]);


  const chat = async () => {
    if (recordedAudioBlob) {

      setIsTyping(true);
      const formData = new FormData();
      formData.append("userAudio", recordedAudioBlob);

      try {
        const response = await fetch("http://localhost:8000/", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.blob();
          const audio = new Audio(URL.createObjectURL(data));

          setAudioMessages((prevAudioMessages) => [...prevAudioMessages, { role: "api_audio", content: audio}]);
          setIsTyping(false);
          scrollTo(0, 1e10);

        } else {
          console.log("No audio response");
        }
      } catch (error) {
        console.error("Error processing audio:", error);
      }
    }

    else {
      setIsTyping(true);
      scrollTo(0, 1e10);

      let msgs = chats;
      msgs.push({ role: "user", content: message });
      setChats(msgs);

      setMessage("");

      try {
        const response = await fetch("http://localhost:8000/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chats,
          }),
        });
        const data = await response.json();

        msgs = chats;
        msgs.push(data.output);
        setChats(msgs);

        setIsTyping(false);
        scrollTo(0, 1e10);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  const startRecording = () => {
    try {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const recordedAudioBlob = new Blob(audioChunks, { type: "audio/webm" });
          setRecordedAudioBlob(recordedAudioBlob); // Store the recorded audio data
          setAudioMessages((prevAudioMessages) => [...prevAudioMessages, { role: "user_audio", content: recordedAudioBlob}]);
          chat();
        };

        mediaRecorder.start()
      });
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <main>
      <h1> Arrhythmia Chatbot</h1>

      <section>
        {audioMessages && audioMessages.length > 0
          ? audioMessages.map((audio, index) => {
            if (audio.role === "user_audio") {
              return (
                <div key={index} className="user_audio">
                  <audio controls src={URL.createObjectURL(audio.content)} />
                </div>
              );
            } else if (audio.role === "api_audio") {
              return (
                <div key={index} className="api_audio">
                  <audio controls src={URL.createObjectURL(audio.content)} />
                </div>
              );
            }
          })
          : ""}
      </section>

      <section>
        {chats && chats.length > 0
          ? chats.map((chat, index) => {
            if (chat.role === "user") {
              return (
                <p key={index} className="user_msg">
                  <span>{chat.content}</span>
                </p>
              );
            } else if (chat.role === "api") {
              return (
                <p key={index} className="api_msg">
                  <span>{chat.content}</span>
                </p>
              );
            }
          })
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

      <div className="recording">
        <button id="start-button" onClick={startRecording}>⏺</button>
        <button id="stop-button" onClick={stopRecording}>⏹</button>
      </div>
    </main>
  );
}

export default App;
