/* ===================== ELEMENT ===================== */
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const snapBtn = document.getElementById("snapBtn");
const editBtn = document.getElementById("editBtn");
const soundBtn = document.getElementById("soundBtn");
const deleteBtn = document.getElementById("deleteBtn");
const downloadBtn = document.getElementById("downloadBtn");
const photoCount = document.getElementById("photoCount");

const preview = document.getElementById("preview");
const countdownEl = document.getElementById("countdown");
const flash = document.getElementById("flash");
const filters = document.getElementById("filters");

const permissionScreen = document.getElementById("permissionScreen");
const startCameraBtn = document.getElementById("startCameraBtn");

/* ===================== STATE ===================== */
let photos = [];
let currentFilter = "none";
let editorCanvas = null;
let cameraStarted = false;
let soundEnabled = true;

/* ===================== AUDIO ===================== */
const shutterSound = new Audio(
  "https://assets.mixkit.co/sfx/preview/mixkit-camera-shutter-click-1133.mp3"
);
const clickSound = new Audio(
  "https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3"
);

function playSound(audio){
  if(soundEnabled) audio.play();
}

document.body.addEventListener("click",()=>{
  shutterSound.load();
  clickSound.load();
},{ once:true });

/* ===================== CAMERA ===================== */
async function startCamera(){
  if(cameraStarted) return;

  startCameraBtn.disabled = true;
  startCameraBtn.textContent = "Mengaktifkan kamera...";

  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video:{ facingMode:"user" },
      audio:false
    });
    video.srcObject = stream;
    cameraStarted = true;
    permissionScreen.style.display = "none";
  }catch(err){
    alert("❌ Kamera ditolak.\nIzinkan kamera lalu refresh halaman.");
    startCameraBtn.disabled = false;
    startCameraBtn.textContent = "Aktifkan Kamera";
  }
}

startCameraBtn.onclick = startCamera;

/* ===================== FILTER ===================== */
const filterData = {
  Normal: "none",
  Bright: "brightness(1.2)",
  Contrast: "contrast(1.4)",
  Warm: "sepia(.4)",
  Cool: "hue-rotate(180deg)",
  BW: "grayscale(1)"
};

Object.entries(filterData).forEach(([name,value])=>{
  const btn = document.createElement("button");
  btn.textContent = name;
  btn.className = "filter-btn";

  btn.onclick = ()=>{
    playSound(clickSound);
    document
      .querySelectorAll(".filter-btn")
      .forEach(b=>b.classList.remove("active"));

    btn.classList.add("active");
    currentFilter = value;
    video.style.filter = value;
  };

  filters.appendChild(btn);
});

/* ===================== PHOTO ===================== */
function flashCam(){
  flash.classList.remove("flash");
  void flash.offsetWidth;
  flash.classList.add("flash");
}

function takePhoto(){
  playSound(shutterSound);
  flashCam();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.filter = currentFilter;
  ctx.drawImage(video,0,0);

  return canvas.toDataURL("image/png");
}

function countdown(seconds, label = ""){
  return new Promise(resolve=>{
    let count = seconds;
    countdownEl.style.opacity = 1;
    countdownEl.textContent = label || count;

    const timer = setInterval(()=>{
      count--;
      if(count === 0){
        clearInterval(timer);
        countdownEl.style.opacity = 0;
        resolve();
      }else{
        countdownEl.textContent = label || count;
      }
    },1000);
  });
}

async function startCapture(){
  await startCamera();
  photos = [];

  for(let i=0;i<photoCount.value;i++){
    await countdown(3, `Foto ${i+1}`);
    photos.push(takePhoto());
  }
  showReview();
}

snapBtn.onclick = startCapture;

/* ===================== REVIEW ===================== */
function showReview(){
  document.querySelector(".camera").style.display = "none";
  document.querySelector(".review").style.display = "block";

  preview.innerHTML = "";
  photos.forEach((src,i)=>{
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <img src="${src}">
      <button>🔄 Retake</button>
    `;
    wrap.querySelector("button").onclick = ()=>retake(i);
    preview.appendChild(wrap);
  });
}

async function retake(index){
  document.querySelector(".camera").style.display = "grid";
  document.querySelector(".review").style.display = "none";

  await countdown(3, `Retake ${index+1}`);
  photos[index] = takePhoto();
  showReview();
}

/* ===================== EDITOR ===================== */
editBtn.onclick = ()=>{
  document.querySelector(".review").style.display = "none";
  document.querySelector(".editor").style.display = "block";

  if(editorCanvas){
    editorCanvas.dispose();
  }

  editorCanvas = new fabric.Canvas("editorCanvas");
  let y = 20;

  photos.forEach(src=>{
    fabric.Image.fromURL(src,img=>{
      img.scaleToWidth(520);
      img.set({
        left:40,
        top:y,
        selectable:false
      });
      y += img.getScaledHeight() + 20;
      editorCanvas.add(img);
    });
  });
};

/* ===================== STICKER ===================== */
document.querySelectorAll("[data-sticker]").forEach(btn=>{
  btn.onclick = ()=>{
    fabric.Image.fromURL(btn.dataset.sticker,img=>{
      img.scaleToWidth(120);
      editorCanvas.add(img);
      editorCanvas.setActiveObject(img);
    });
  };
});

/* ===================== FRAME ===================== */
document.querySelectorAll("[data-frame]").forEach(btn=>{
  btn.onclick = ()=>{
    fabric.Image.fromURL(btn.dataset.frame,img=>{
      img.scaleToWidth(editorCanvas.width);
      img.set({
        left:0,
        top:0,
        selectable:false,
        evented:false
      });
      editorCanvas.add(img);
      editorCanvas.sendToBack(img);
    });
  };
});

/* ===================== BACKGROUND ===================== */
document.querySelectorAll("[data-bg]").forEach(btn=>{
  btn.onclick = ()=>{
    editorCanvas.setBackgroundColor(
      btn.dataset.bg,
      editorCanvas.renderAll.bind(editorCanvas)
    );
  };
});

/* ===================== UI ===================== */
soundBtn.onclick = ()=>{
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
};

deleteBtn.onclick = ()=>{
  const obj = editorCanvas.getActiveObject();
  if(obj) editorCanvas.remove(obj);
};

downloadBtn.onclick = ()=>{
  const a = document.createElement("a");
  a.download = "photobooth.png";
  a.href = editorCanvas.toDataURL({ multiplier:2 });
  a.click();
};
