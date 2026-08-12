// ===== LOADER (SAFE & FORCE HIDE) =====
(function () {
  const loader = document.getElementById("loader");
  if (!loader) return;

  function hideLoader() {
    loader.classList.add("hide");
    setTimeout(() => {
      loader.style.display = "none";
    }, 700);
  }

  window.addEventListener("load", hideLoader);
  setTimeout(hideLoader, 2500);
})();


// ===== MOBILE MENU =====
(function () {
  const menuBtn = document.getElementById("menuBtn");
  const navMenu = document.getElementById("navMenu");
  if (!menuBtn || !navMenu) return;

  function setIcon(open){
    menuBtn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  }
  function openMenu(){ navMenu.classList.add("show"); setIcon(true); }
  function closeMenu(){ navMenu.classList.remove("show"); setIcon(false); }
  function toggleMenu(){ navMenu.classList.contains("show") ? closeMenu() : openMenu(); }

  setIcon(false);
  menuBtn.addEventListener("click", (e)=>{ e.stopPropagation(); toggleMenu(); });
  navMenu.querySelectorAll("a").forEach(a=>a.addEventListener("click", closeMenu));
  document.addEventListener("click",(e)=>{ if(!navMenu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu(); });
  window.addEventListener("resize", ()=>{ if(window.innerWidth>768) closeMenu(); });
})();


// ===== SERVICES FILTER (only if exists) =====
(function(){
  const searchBox = document.getElementById("searchBox");
  const category = document.getElementById("category");
  const grid = document.getElementById("serviceGrid");
  if(!searchBox || !category || !grid) return;

  const cards = [...grid.querySelectorAll(".card")];

  function applyFilter(){
    const q = searchBox.value.trim().toLowerCase();
    const cat = category.value;
    cards.forEach(card=>{
      const name = (card.dataset.name||"").toLowerCase();
      const c = card.dataset.cat;
      const matchText = !q || name.includes(q);
      const matchCat = (cat === "all") || (c === cat);
      card.style.display = (matchText && matchCat) ? "" : "none";
    });
  }
  searchBox.addEventListener("input", applyFilter);
  category.addEventListener("change", applyFilter);
})();


// ===== WATER / RIPPLE BACKGROUND (Canvas) =====
(function(){
  const canvas = document.getElementById("waterCanvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0, t = 0;
  const ripples = [];

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  let lastAdd = 0;
  window.addEventListener("mousemove", (e)=>{
    const now = performance.now();
    if(now - lastAdd < 35) return;
    lastAdd = now;
    ripples.push({x:e.clientX, y:e.clientY, r:0, a:0.45});
    if(ripples.length > 60) ripples.shift();
  });

  function draw(){
    t += 0.016;
    ctx.clearRect(0,0,w,h);

    ctx.globalCompositeOperation = "source-over";
    for(let y=0; y<h; y+=10){
      const sway = Math.sin(t*1.2 + y*0.02) * 14;
      ctx.beginPath();
      ctx.moveTo(0, y + sway);
      for(let x=0; x<=w; x+=40){
        const yy = y + Math.sin(t*1.2 + x*0.01 + y*0.02) * 11;
        ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = "rgba(59,220,42,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "lighter";
    for(let i=ripples.length-1; i>=0; i--){
      const rp = ripples[i];
      rp.r += 3.2;
      rp.a *= 0.985;

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(59,220,42,${rp.a})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r*0.65, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255,255,255,${rp.a*0.08})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      if(rp.a < 0.02) ripples.splice(i,1);
    }

    requestAnimationFrame(draw);
  }
  draw();
})();


// ===== FAQ MODAL =====
(() => {
  const modal = document.getElementById("faqModal");
  const titleEl = document.getElementById("faqModalTitle");
  const answerEl = document.getElementById("faqModalAnswer");
  const closeBtn = document.getElementById("faqCloseBtn");

  if (!modal || !titleEl || !answerEl || !closeBtn) return;

  const openModal = (q, a) => {
    titleEl.textContent = q || "FAQ";
    answerEl.textContent = a || "";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.querySelectorAll(".faq-item").forEach(btn => {
    btn.addEventListener("click", () => {
      openModal(btn.dataset.question, btn.dataset.answer);
    });
  });

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.close === "true") closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
  });
})();


// ===== WHY PILL AUTO NEON ROTATION + TOUCH/HOVER =====
(function(){
  const row = document.getElementById("whyRow");
  if(!row) return;

  const pills = Array.from(row.querySelectorAll(".why-pill"));
  if(!pills.length) return;

  let i = 0;
  let timer = null;

  function setActive(idx){
    pills.forEach(p => p.classList.remove("is-active"));
    pills[idx].classList.add("is-active");
  }
  function start(){
    stop();
    timer = setInterval(()=>{
      i = (i + 1) % pills.length;
      setActive(i);
    }, 1400);
  }
  function stop(){ if(timer) clearInterval(timer); }

  setActive(0);
  start();

  pills.forEach((p, idx)=>{
    p.addEventListener("mouseenter", ()=>{ stop(); setActive(idx); });
    p.addEventListener("mouseleave", ()=>{ i = idx; start(); });

    p.addEventListener("touchstart", ()=>{ stop(); setActive(idx); }, {passive:true});
    p.addEventListener("touchend", ()=>{ i = idx; start(); }, {passive:true});
  });
})();


// ===== REACH: Scroll reveal + pause animation when out of view =====
(function(){
  const el = document.querySelector('.reach-wrap.reveal');
  if(!el) return;

  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) el.classList.add('is-visible');
    });
  }, {threshold: 0.18});
  obs.observe(el);

  const track = document.querySelector('.reach-section .track');
  const sec = document.querySelector('#reach');
  if(!track || !sec) return;

  const obs2 = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      track.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
    });
  }, {threshold: 0.05});
  obs2.observe(sec);
})();


// ===== FOOTER YEAR =====
(function(){
  const y = document.getElementById("year");
  if(y) y.textContent = new Date().getFullYear();
})();
