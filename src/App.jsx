import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const dotsRef = useRef([]);
  const [listening, setListening] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  let audioContext, analyser, microphone, dataArray, animationId;
  let mediaRecorder;
  let audioChunks = [];

  const animateDots = (volume) => {
    dotsRef.current.forEach((dot, i) => {
      let scale = 1 + volume * (i + 1) * 0.2; // 🔥 stronger wave
      scale = Math.min(scale, 4); // limit max growth
      dot.style.transform = `scale(${scale})`;
      dot.style.opacity = Math.min(1, 0.5 + volume / 80);
    });
  };

  const startListening = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    dataArray = new Uint8Array(analyser.fftSize);

    // setup recording
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    };
    mediaRecorder.start();

    function draw() {
      analyser.getByteFrequencyData(dataArray);
      let volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      animateDots(volume / 10); // normalized bigger
      animationId = requestAnimationFrame(draw);
    }
    draw();

    setListening(true);
  };

  const stopListening = () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (audioContext) audioContext.close();
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    dotsRef.current.forEach((dot) => {
      dot.style.transform = "scale(1)";
      dot.style.opacity = "0.6";
    });
    setListening(false);
  };

  return (
    <div className="app">
      <div className="listener">
        {[...Array(7)].map((_, i) => ( // 🔥 increased from 5 → 7 dots
          <span
            key={i}
            ref={(el) => (dotsRef.current[i] = el)}
            className={`dot ${i === 3 ? "center" : ""}`}
          ></span>
        ))}
      </div>

      {!listening ? (
        <button onClick={startListening}>🎤 Start Listening</button>
      ) : (
        <button onClick={stopListening}>⏹ Stop Listening</button>
      )}

      {audioUrl && (
        <div className="player">
          <h3>▶️ Your Recording</h3>
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
}

export default App;
