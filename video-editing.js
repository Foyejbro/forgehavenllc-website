const root = document.documentElement;
const canvas = document.getElementById("waterFx");
const ctx = canvas.getContext("2d", { alpha: true });

let W=0, H=0, DPR=1;

function resize(){
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
resize();
window.addEventListener("resize", resize, { passive:true });

const ACCENTS = {
  "blue-cyan":   { a:"#2b7bff", b:"#19f5ff" },
  "cyan-pink":   { a:"#19f5ff", b:"#ff3fd1" },
  "purple-pink": { a:"#9b5cff", b:"#ff3fd1" },
  "blue-purple": { a:"#2b7bff", b:"#9b5cff" },
  "cyan-purple": { a:"#19f5ff", b:"#9b5cff" },
  "pink-blue":   { a:"#ff3fd1", b:"#2b7bff" },
};

function setAccent(key){
  const p = ACCENTS[key] || ACCENTS["cyan-pink"];
  root.style.setProperty("--accentA", p.a);
  root.style.setProperty("--accentB", p.b);
}
setAccent("cyan-pink");

// --- Particles
const drops = [];
const ripples = [];

function rand(min,max){ return Math.random()*(max-min)+min; }

function addDroplet(x,y, power=1){
  drops.push({
    x, y,
    vx: rand(-0.45,0.45) * power,
    vy: rand(0.10,0.85) * power,
    r:  rand(1.1, 2.4) * power,
    a:  rand(0.18,0.42),
    life: rand(22, 42),
    mix: Math.random()
  });
}

function addSplash(x,y, intensity=1){
  const n = Math.floor(10 + 14*intensity);
  for(let i=0;i<n;i++){
    drops.push({
      x, y,
      vx: rand(-3.0, 3.0) * intensity,
      vy: rand(-3.2, 1.6) * intensity,
      r:  rand(1.2, 3.2) * (0.85 + intensity*0.22),
      a:  rand(0.22,0.52),
      life: rand(24, 54),
      mix: Math.random()
    });
  }
  ripples.push({ x, y, r: 0, a: 0.30 + 0.12*intensity, life: 42 + 18*intensity });
}

function hexToRgb(hex){
  let h = (hex||"").replace("#","").trim();
  if(h.length===3) h = h.split("").map(c=>c+c).join("");
  const n = parseInt(h,16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}
function mixRGBA(c1, c2, t, a){
  const r1 = hexToRgb(c1), r2 = hexToRgb(c2);
  const r = Math.round(r1.r + (r2.r - r1.r)*t);
  const g = Math.round(r1.g + (r2.g - r1.g)*t);
  const b = Math.round(r1.b + (r2.b - r1.b)*t);
  return `rgba(${r},${g},${b},${a})`;
}

function getPoint(e){
  if(e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if(e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

// --- DOM ripple (inside clicked element)
function spawnDomRipple(target, x, y){
  const rect = target.getBoundingClientRect();
  const rx = x - rect.left;
  const ry = y - rect.top;
  const el = document.createElement("span");
  el.className = "ripple";
  el.style.left = rx + "px";
  el.style.top  = ry + "px";
  target.appendChild(el);
  el.addEventListener("animationend", ()=> el.remove(), { once:true });
}

// --- Accent shift handlers
document.querySelectorAll(".fx-section").forEach(sec=>{
  const key = sec.getAttribute("data-accent") || "cyan-pink";

  const activate = ()=>{
    setAccent(key);
    sec.classList.add("is-active");
  };
  const deactivate = ()=>{
    sec.classList.remove("is-active");
  };

  sec.addEventListener("pointerenter", activate, { passive:true });
  sec.addEventListener("pointerleave", deactivate, { passive:true });
  sec.addEventListener("pointerdown", activate, { passive:true });
  sec.addEventListener("touchstart", activate, { passive:true });
  sec.addEventListener("touchend", deactivate, { passive:true });
});

// --- Click splash (offset to right)
function onClickSplash(e){
  const pt = getPoint(e);
  const target = e.currentTarget;

  spawnDomRipple(target, pt.x, pt.y);

  const rect = target.getBoundingClientRect();
  const bias = Math.min(60, rect.width * 0.18);
  const sx = Math.min(W-10, pt.x + bias);
  const sy = pt.y;

  addSplash(sx, sy, 1.05);
}
document.querySelectorAll(".fx-click").forEach(el=>{
  el.addEventListener("pointerdown", onClickSplash, { passive:true });
  el.addEventListener("touchstart", onClickSplash, { passive:true });
});

// --- Mouse move droplets (throttled, clean)
let lastMove = 0;
const moveGap = 24;

function onMove(e){
  const now = performance.now();
  if(now - lastMove < moveGap) return;
  lastMove = now;

  const pt = getPoint(e);
  addDroplet(pt.x, pt.y, 1);

  if(Math.random() < 0.06){
    ripples.push({ x: pt.x, y: pt.y, r: 0, a: 0.12, life: 26 });
  }
}
window.addEventListener("pointermove", onMove, { passive:true });
window.addEventListener("touchmove", onMove, { passive:true });

// --- Render
function draw(){
  ctx.clearRect(0,0,W,H);

  const a = getComputedStyle(root).getPropertyValue("--accentA").trim() || "#19f5ff";
  const b = getComputedStyle(root).getPropertyValue("--accentB").trim() || "#ff3fd1";

  // Ripples
  for(let i=ripples.length-1;i>=0;i--){
    const r = ripples[i];
    r.r += 6.2;
    r.life -= 1;

    const alpha = Math.max(0, r.a * (r.life/60));

    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI*2);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = `rgba(255,255,255,${alpha*0.25})`;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r*0.84, 0, Math.PI*2);
    ctx.lineWidth = 1.35;
    ctx.strokeStyle = mixRGBA(a, b, 0.55, alpha*0.48);
    ctx.stroke();

    if(r.life <= 0) ripples.splice(i,1);
  }

  // Droplets
  for(let i=drops.length-1;i>=0;i--){
    const d = drops[i];
    d.x += d.vx;
    d.y += d.vy;
    d.vy += 0.05;
    d.life -= 1;
    d.a *= 0.987;

    const alpha = Math.max(0, d.a);
    const col = mixRGBA(a, b, d.mix, alpha);

    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
    ctx.fillStyle = col;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(d.x - d.r*0.35, d.y - d.r*0.35, Math.max(0.7, d.r*0.45), 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${alpha*0.45})`;
    ctx.fill();

    if(d.life <= 0 || d.a < 0.02 || d.y > H+40) drops.splice(i,1);
  }

  requestAnimationFrame(draw);
}
draw();
