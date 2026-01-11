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

let photos = [];
let currentFilter = "none";
let editorCanvas;
let cameraStarted = false;
let soundEnabled = true;

/* AUDIO */
const shutterSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-camera-shutter-click-1133.mp3");
const clickSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3");

document.body.addEventListener("click",()=>{
  shutterSound.load();
  clickSound.load();
},{once:true});

/* CAMERA */
async function startCamera(){
  if(cameraStarted) return;
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:"user"},
      audio:false
    });
    video.srcObject = stream;
    cameraStarted = true;
    permissionScreen.style.display="none";
  }catch(e){
    alert("❌ Kamera ditolak\nIzinkan kamera di browser lalu refresh");
  }
}

startCameraBtn.onclick = startCamera;

/* FILTER */
const filterData={
  Normal:"none",
  Bright:"brightness(1.2)",
  Contrast:"contrast(1.4)",
  Warm:"sepia(.4)",
  Cool:"hue-rotate(180deg)",
  BW:"grayscale(1)"
};

Object.entries(filterData).forEach(([n,v])=>{
  const b=document.createElement("button");
  b.textContent=n;
  b.className="filter-btn";
  b.onclick=()=>{
    clickSound.play();
    document.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    currentFilter=v;
    video.style.filter=v;
  };
  filters.appendChild(b);
});

/* PHOTO */
function flashCam(){
  flash.classList.remove("flash");
  void flash.offsetWidth;
  flash.classList.add("flash");
}

function takePhoto(){
  shutterSound.play();
  flashCam();
  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;
  ctx.filter=currentFilter;
  ctx.drawImage(video,0,0);
  return canvas.toDataURL();
}

function countdown(sec){
  return new Promise(r=>{
    countdownEl.style.opacity=1;
    let n=sec;
    countdownEl.textContent=n;
    const t=setInterval(()=>{
      n--;
      if(n===0){
        clearInterval(t);
        countdownEl.style.opacity=0;
        r();
      }else countdownEl.textContent=n;
    },1000);
  });
}

async function startCapture(){
  await startCamera();
  photos=[];
  for(let i=0;i<photoCount.value;i++){
    await countdown(3);
    photos.push(takePhoto());
  }
  showReview();
}

snapBtn.onclick=startCapture;

/* REVIEW */
function showReview(){
  document.querySelector(".camera").style.display="none";
  document.querySelector(".review").style.display="block";
  preview.innerHTML="";
  photos.forEach((src,i)=>{
    preview.innerHTML+=`
      <div>
        <img src="${src}">
        <button onclick="retake(${i})">Retake</button>
      </div>`;
  });
}

async function retake(i){
  document.querySelector(".camera").style.display="grid";
  document.querySelector(".review").style.display="none";
  await countdown(3);
  photos[i]=takePhoto();
  showReview();
}

/* EDITOR */
editBtn.onclick=()=>{
  document.querySelector(".review").style.display="none";
  document.querySelector(".editor").style.display="block";
  setTimeout(()=>{
    editorCanvas=new fabric.Canvas("editorCanvas");
    let y=20;
    photos.forEach(p=>{
      fabric.Image.fromURL(p,img=>{
        img.scaleToWidth(520);
        img.set({left:40,top:y,selectable:false});
        y+=img.getScaledHeight()+20;
        editorCanvas.add(img);
      });
    });
  },50);
};

/* UI */
soundBtn.onclick=()=>{
  soundEnabled=!soundEnabled;
  soundBtn.textContent=soundEnabled?"🔊 Sound ON":"🔇 Sound OFF";
};

deleteBtn.onclick=()=>{
  const o=editorCanvas.getActiveObject();
  if(o) editorCanvas.remove(o);
};

downloadBtn.onclick=()=>{
  const a=document.createElement("a");
  a.download="photobooth.png";
  a.href=editorCanvas.toDataURL({multiplier:2});
  a.click();
};
