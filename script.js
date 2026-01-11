const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("start");
const downloadBtn = document.getElementById("download");
const countdownEl = document.getElementById("countdown");
const filterSelect = document.getElementById("filter");

let photos = [];

// Kamera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(() => alert("Kamera tidak bisa diakses"));

// Countdown
function countdown(seconds) {
  return new Promise(resolve => {
    let count = seconds;
    countdownEl.textContent = count;
    const timer = setInterval(() => {
      count--;
      countdownEl.textContent = count || "";
      if (count === 0) {
        clearInterval(timer);
        resolve();
      }
    }, 1000);
  });
}

// Ambil foto
function capturePhoto() {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const tctx = tempCanvas.getContext("2d");

  tctx.filter = filterSelect.value;
  tctx.translate(tempCanvas.width, 0);
  tctx.scale(-1, 1);
  tctx.drawImage(video, 0, 0);

  photos.push(tempCanvas);
}

// Start photobooth
startBtn.onclick = async () => {
  photos = [];
  downloadBtn.disabled = true;

  for (let i = 0; i < 3; i++) {
    await countdown(3);
    capturePhoto();
  }

  renderLayout();
  downloadBtn.disabled = false;
};

// Layout strip
function renderLayout() {
  const w = 300;
  const h = 220;

  canvas.width = w + 40;
  canvas.height = h * 3 + 60;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  photos.forEach((photo, i) => {
    ctx.drawImage(photo, 20, 20 + i * (h + 10), w, h);
  });

  ctx.fillStyle = "#000";
  ctx.font = "16px Arial";
  ctx.fillText("Photobooth Pro", 20, canvas.height - 15);
}

// Download
downloadBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = "photobooth.png";
  link.href = canvas.toDataURL();
  link.click();
};
