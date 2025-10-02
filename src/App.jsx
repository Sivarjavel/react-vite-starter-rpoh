import React, { useState, useRef } from "react";
import { WaveSurfer, WaveForm } from "wavesurfer-react";
import PitchShift from "soundtouchjs";

export default function App() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [wavesurfer, setWavesurfer] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.current.push(e.data);
      }
    };
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);

      // ---- Convert male → female (pitch shift) ----
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);

      // Pitch shift by ~ +4 semitones (female-ish)
      const pitchShifter = new PitchShift(audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(pitchShifter.input);
      pitchShifter.transpose = 4; // semitone up
      pitchShifter.connect(audioCtx.destination);

      setAudioUrl(url);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: "20px" }}>🎤 Voice Recorder</h1>

      {!recording ? (
        <button
          onClick={startRecording}
          style={{
            padding: "15px 30px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "30px",
            fontSize: "18px",
            cursor: "pointer",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
          }}
        >
          ▶ Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          style={{
            padding: "15px 30px",
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "30px",
            fontSize: "18px",
            cursor: "pointer",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
          }}
        >
          ⏹ Stop Recording
        </button>
      )}

      {audioUrl && (
        <div style={{ marginTop: "40px" }}>
          <h3>🔊 Playback (Female Voice)</h3>
          <WaveSurfer onMount={setWavesurfer}>
            <WaveForm
              id="waveform"
              barWidth={3}
              barHeight={1}
              barGap={2}
              cursorWidth={2}
              progressColor="#007bff"
              responsive={true}
              waveColor="#ccc"
            />
          </WaveSurfer>
          <audio
            src={audioUrl}
            controls
            style={{ marginTop: "20px", width: "100%" }}
            onPlay={() => wavesurfer && wavesurfer.play()}
            onPause={() => wavesurfer && wavesurfer.pause()}
          />
        </div>
      )}
    </div>
  );
}
