import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Your browser does not support Speech Recognition API");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "auto"; // detect language automatically

    recognition.onresult = async (event) => {
      let lastResultIndex = event.results.length - 1;
      let spokenText = event.results[lastResultIndex][0].transcript;

      // Optional: Translate to English using free API
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            spokenText
          )}&langpair=auto|en`
        );
        const data = await res.json();
        if (data.responseData && data.responseData.translatedText) {
          setTranscript(data.responseData.translatedText);
        } else {
          setTranscript(spokenText);
        }
      } catch (err) {
        setTranscript(spokenText); // fallback
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  return (
    <div className="app">
      <h1>🗣️ AI Voice to English</h1>
      <div className="listener-ui">
        <span className={listening ? "dot active" : "dot"}></span>
        <span className={listening ? "dot active" : "dot"}></span>
        <span className={listening ? "dot active" : "dot center"}></span>
        <span className={listening ? "dot active" : "dot"}></span>
        <span className={listening ? "dot active" : "dot"}></span>
      </div>

      {!listening ? (
        <button onClick={startListening}>🎤 Start Listening</button>
      ) : (
        <button onClick={stopListening}>⏹ Stop Listening</button>
      )}

      <div className="transcript-box">
        <h3>📝 English Text</h3>
        <p>{transcript}</p>
      </div>
    </div>
  );
}

export default App;
