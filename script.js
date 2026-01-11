/* ========= ELEMENT ========= */
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const cd = document.getElementById("countdown");
const flash = document.getElementById("flash");
const preview = document.getElementById("preview");
const filters = document.getElementById("filters");

const snapBtn = document.getElementById("snapBtn");
const editBtn = document.getElementById("editBtn");
const soundBtn = document.getElementById("soundBtn");
const deleteBtn = document.getElementById("deleteBtn");
const downloadBtn = document.getElementById("downloadBtn");
const photoCount = document.getElementById("photoCount");

/* ========= STATE ========= */
let photos = [];
let currentFilter = "none";
let editorCanvas = null;
let currentFrame = null;
let soundEnabled = true;

/* ========= AUDIO (HTTPS SAFE) ========= */
const shutterSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-camera-shutter-click-1133.mp3");
const clickSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3");

/* Browser unlock audio */
document.body.addEventListener("click", () => {
  shutterSound.load();
  clickSound.load();
}, { once:true });

/* ========= CAMERA ========= */
navigator.mediaDevices.getUserMedia({ video:true })
  .then(stream => video.srcObject = stream)
  .catch(err => {
    alert("❌ Kamera tidak bisa diakses.\nPastikan HTTPS & izin kamera aktif.");
    console.error(err);
  });

/* ========= FILTER ========= */
const filterData = {
  Normal:"none",
  Bright:"brightness(1.2)",
  Contrast:"contrast(1.4)",
  Warm:"sepia(.4)",
  Cool:"hue-rotate(180deg)",
  "B&W":"grayscale(1)"
};

Object.entries(filterData).forEach(([name,val])=>{
  const b=document.createElement("button");
  b.textContent=name;
  b.className="filter-btn";
  b.onclick=()=>{
    playClick();
    document.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    currentFilter=val;
    video.style.filter=val;
  };
  filters.appendChild(b);
});

/* ========= UTIL ========= */
function playClick(){
  if(!soundEnabled) return;
  clickSound.currentTime=0;
  clickSound.play();
}
function toggleSound(){
  soundEnabled=!soundEnabled;
  soundBtn.textContent = soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
}
function cameraFlash(){
  flash.classList.remove("flash-animate");
  void flash.offsetWidth;
  flash.classList.add("flash-animate");
}

/* ========= PHOTO ========= */
function countdown(sec){
  return new Promise(r=>{
    cd.style.opacity=1;
    let n=sec;
    cd.textContent=n;
    const t=setInterval(()=>{
      n--;
      if(n===0){
        clearInterval(t);
        cd.style.opacity=0;
        r();
      } else cd.textContent=n;
    },1000);
  });
}

function takePhoto(){
  if(soundEnabled){
    shutterSound.currentTime=0;
    shutterSound.play();
  }
  cameraFlash();
  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;
  ctx.filter=currentFilter;
  ctx.drawImage(video,0,0);
  return canvas.toDataURL();
}

async function startCapture(){
  playClick();
  photos=[];
  for(let i=0;i<photoCount.value;i++){
    await countdown(3);
    photos.push(takePhoto());
  }
  showReview();
}

function showReview(){
  document.querySelector(".camera").style.display="none";
  document.querySelector(".review").style.display="block";
  preview.innerHTML="";
  photos.forEach((src,i)=>{
    const d=document.createElement("div");
    d.innerHTML=`<img src="${src}"><button onclick="retake(${i})">Retake</button>`;
    preview.appendChild(d);
  });
}

async function retake(i){
  playClick();
  document.querySelector(".camera").style.display="grid";
  document.querySelector(".review").style.display="none";
  await countdown(3);
  photos[i]=takePhoto();
  showReview();
}

/* ========= EDITOR ========= */
function openEditor(){
  playClick();
  document.querySelector(".review").style.display="none";
  document.querySelector(".editor").style.display="block";
  setTimeout(()=>{
    if(editorCanvas) editorCanvas.dispose();
    editorCanvas=new fabric.Canvas("editorCanvas",{preserveObjectStacking:true});
    buildPhotoStrip();
  },50);
}

function buildPhotoStrip(){
  editorCanvas.clear();
  let y=20;
  photos.forEach(src=>{
    fabric.Image.fromURL(src,img=>{
      img.scaleToWidth(520);
      img.set({left:40,top:y,selectable:false});
      y+=img.getScaledHeight()+20;
      editorCanvas.add(img);
    });
  });
}

function addFrame(url){
  playClick();
  if(currentFrame) editorCanvas.remove(currentFrame);
  fabric.Image.fromURL(url,img=>{
    img.scaleToWidth(editorCanvas.width);
    img.scaleToHeight(editorCanvas.height);
    img.set({left:0,top:0,selectable:false});
    editorCanvas.add(img);
    img.bringToFront();
    currentFrame=img;
  });
}

function addSticker(url){
  playClick();
  fabric.Image.fromURL(url,img=>{
    img.scale(0.25);
    img.set({left:260,top:450});
    editorCanvas.add(img);
    editorCanvas.setActiveObject(img);
  });
}

function setBg(color){
  playClick();
  editorCanvas.setBackgroundColor(color,editorCanvas.renderAll.bind(editorCanvas));
}

function deleteObject(){
  playClick();
  const o=editorCanvas.getActiveObject();
  if(o) editorCanvas.remove(o);
}

function downloadFinal(){
  playClick();
  const a=document.createElement("a");
  a.download="photobooth.png";
  a.href=editorCanvas.toDataURL({multiplier:2});
  a.click();
}

/* ========= EVENTS ========= */
snapBtn.onclick=startCapture;
editBtn.onclick=openEditor;
soundBtn.onclick=toggleSound;
deleteBtn.onclick=deleteObject;
downloadBtn.onclick=downloadFinal;

document.querySelectorAll("[data-bg]").forEach(b=>{
  b.onclick=()=>setBg(b.dataset.bg);
});
document.querySelectorAll("[data-frame]").forEach(b=>{
  b.onclick=()=>addFrame(b.dataset.frame);
});
document.querySelectorAll("[data-sticker]").forEach(b=>{
  b.onclick=()=>addSticker(b.dataset.sticker);
});
