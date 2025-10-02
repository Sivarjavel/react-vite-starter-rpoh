// src/App.jsx
import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const dotsRef = useRef([]);
  const [listening, setListening] = useState(false);
  let audioContext, analyser, microphone, dataArray, animationId;

  const animateDots = (volume) => {
    dotsRef.current.forEach((dot, i) => {
      let scale = 1 + volume * (i + 1) * 0.1;
      scale = Math.min(scale, 3);
      dot.style.transform = `scale(${scale})`;
      dot.style.opacity = Math.min(1, 0.5 + volume / 100);
    });
  };

  const startListening = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      dataArray = new Uint8Array(analyser.fftSize);

      function draw() {
        analyser.getByteFrequencyData(dataArray);
        let volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        animateDots(volume / 20);
        animationId = requestAnimationFrame(draw);
      }
      draw();
    });
    setListening(true);
  };

  const stopListening = () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (audioContext) audioContext.close();
    dotsRef.current.forEach((dot) => {
      dot.style.transform = "scale(1)";
      dot.style.opacity = "0.6";
    });
    setListening(false);
  };

  return (
    <div className="app">
      <div className="listener">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            ref={(el) => (dotsRef.current[i] = el)}
            className={`dot ${i === 2 ? "center" : ""}`}
          ></span>
        ))}
      </div>

      {!listening ? (
        <button onClick={startListening}>🎤 Start Listening</button>
      ) : (
        <button onClick={stopListening}>⏹ Stop Listening</button>
      )}
    </div>
  );
}

export default App;
