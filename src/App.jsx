import { useRef, useState } from "react";
import "./App.css";

function App() {
  const dotsRef = useRef([]);
  const [listening, setListening] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationIdRef = useRef(null);

  const animateDots = (volume) => {
    dotsRef.current.forEach((dot, i) => {
      let scale = 1 + volume * (i + 1) * 0.2; // stronger wave
      scale = Math.min(scale, 4);
      dot.style.transform = `scale(${scale})`;
      dot.style.opacity = Math.min(1, 0.5 + volume / 80);
    });
  };

  const startListening = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Setup Audio Context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    microphoneRef.current = microphone;

    const dataArray = new Uint8Array(analyser.fftSize);

    // Animate dots
    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      let volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      animateDots(volume / 10);
      animationIdRef.current = requestAnimationFrame(draw);
    };
    draw();

    // Setup recorder
    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url); // 🔥 ensure url is set after stop
    };

    mediaRecorder.start();
    setListening(true);
  };

  const stopListening = () => {
    // Stop animation
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Stop audio context (after stopping recorder)
    setTimeout(() => {
      if (audioContextRef.current) audioContextRef.current.close();
    }, 500);

    // Reset dots
    dotsRef.current.forEach((dot) => {
      dot.style.transform = "scale(1)";
      dot.style.opacity = "0.6";
    });

    setListening(false);
  };

  return (
    <div className="app">
      <div className="listener">
        {[...Array(7)].map((_, i) => (
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
          <h3>▶️ Playback</h3>
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
}

export default App;
