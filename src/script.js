const dots = document.querySelectorAll(".dot");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

let audioContext, analyser, microphone, dataArray, animationId;

function animateDots(volume) {
  dots.forEach((dot, i) => {
    let scale = 1 + volume * (i + 1) * 0.1; // scale based on volume + position
    scale = Math.min(scale, 3); // limit growth
    dot.style.transform = `scale(${scale})`;
    dot.style.opacity = Math.min(1, 0.5 + volume / 100);
  });
}

function startListening() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    dataArray = new Uint8Array(analyser.fftSize);

    function draw() {
      analyser.getByteFrequencyData(dataArray);
      let volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      animateDots(volume / 20); // normalize
      animationId = requestAnimationFrame(draw);
    }
    draw();
  });
}

function stopListening() {
  if (animationId) cancelAnimationFrame(animationId);
  if (audioContext) audioContext.close();
  dots.forEach((dot) => {
    dot.style.transform = "scale(1)";
    dot.style.opacity = "0.6";
  });
}

startBtn.addEventListener("click", startListening);
stopBtn.addEventListener("click", stopListening);
