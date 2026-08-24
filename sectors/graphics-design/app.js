const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(typeof Lenis!=="undefined" && !reduceMotion){
  const lenis=new Lenis({duration:1.05,easing:t=>1-Math.pow(1-t,3),smoothWheel:true});
  function raf(time){lenis.raf(time);requestAnimationFrame(raf);}
  requestAnimationFrame(raf);
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",e=>{
      const id=a.getAttribute("href");
      if(id.length>1 && $(id)){e.preventDefault();lenis.scrollTo(id,{offset:-90});}
    });
  });
}


const menu=$("#menuBtn"), nav=$("#navMenu");
if(menu) menu.addEventListener("click",()=>nav.classList.toggle("open"));
$$("#navMenu a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("in");revealObserver.unobserve(entry.target);}});
},{threshold:.12,rootMargin:"0px 0px -5% 0px"});
$$(".reveal").forEach(el=>{
  const siblings=[...el.parentElement.children].filter(c=>c.classList&&c.classList.contains("reveal"));
  const idx=siblings.indexOf(el);
  if(idx>0) el.style.transitionDelay=Math.min(idx*90,360)+"ms";
  revealObserver.observe(el);
});

const progress=$("#progress");
function updateProgress(){
  const max=document.documentElement.scrollHeight-innerHeight;
  progress.style.width=(max>0?(scrollY/max*100):0)+"%";
}
addEventListener("scroll",updateProgress,{passive:true}); updateProgress();

const services=[
 {title:"Brand Identity",intro:"A visual foundation that makes a business feel consistent across real customer touchpoints.",word:"IDENTITY",sub:"SYSTEM / CLARITY / RECOGNITION",items:["Logo direction or logo refinement","Color and typography system","Stationery / corporate applications","Social profile brand assets","Practical identity guidance"]},
 {title:"Marketing Design",intro:"Campaign and promotional graphics built around clear hierarchy, message and commercial context.",word:"CAMPAIGN",sub:"MESSAGE / OFFER / VISIBILITY",items:["Campaign key visuals","Posters and banners","Promotional graphics","Product marketing materials","Sales / launch creative"]},
 {title:"Social & Ad Creative",intro:"Platform-aware visuals designed for fast viewing, content consistency and paid campaign variation.",word:"SOCIAL",sub:"CONTENT / ADS / VARIANTS",items:["Facebook and Instagram posts","Stories and covers","Paid-ad creative variants","Thumbnails","Reusable content templates"]},
 {title:"Photo Manipulation",intro:"Advanced image production for commercial artwork, campaigns, products and visual storytelling.",word:"IMAGE",sub:"RETOUCH / COMPOSITE / FX",items:["High-end retouching","Creative compositing","Background replacement","Image restoration","Product and commercial graphics"]},
 {title:"Print & Corporate",intro:"Professional layouts prepared for business communication and real print production.",word:"PRINT",sub:"LAYOUT / CORPORATE / PRODUCTION",items:["Brochures and flyers","Corporate presentations","Business stationery","Posters","Print-ready files"]},
 {title:"Redesign & Recreation",intro:"Existing visuals can be cleaned up, modernized, adapted or rebuilt into a stronger direction.",word:"REDESIGN",sub:"IMPROVE / ADAPT / MODERNIZE",items:["Existing design improvement","Reference-led new direction","Design cleanup","New size adaptations","Modernization of old artwork"]}
];

const posterImages=["assets/creative-eye.png","assets/digital-face.png","assets/creative-eye.png","assets/digital-face.png","assets/creative-eye.png","assets/digital-face.png"];
function setService(i){
  const s=services[i];
  $("#serviceTitle").textContent=s.title;
  $("#serviceIntro").textContent=s.intro;
  $("#posterWord").textContent=s.word;
  $("#posterSub").textContent=s.sub;
  $("#serviceDeliverables").innerHTML=s.items.map(x=>`<li>${x}</li>`).join("");
  $("#serviceCounter").textContent=String(i+1).padStart(2,"0")+" / 06";
  $(".service-no").textContent=String(i+1).padStart(2,"0");
  $$(".service-tabs button").forEach((b,j)=>b.classList.toggle("active",i===j));
  const posterImg=$("#posterImg");
  if(posterImg){posterImg.style.opacity=0; setTimeout(()=>{posterImg.src=posterImages[i]; posterImg.style.opacity=.5;},260);}
  const poster=$("#servicePoster");
  poster.animate([{opacity:.25,transform:"perspective(1000px) rotateY(-12deg) scale(.97)"},{opacity:1,transform:"perspective(1000px) rotateY(-6deg) scale(1)"}],{duration:600,easing:"cubic-bezier(.2,.8,.2,1)"});
}
$$(".service-tabs button").forEach((b,i)=>b.addEventListener("click",()=>setService(i)));
$$("[data-service-jump]").forEach(b=>b.addEventListener("click",()=>{
  const i=Number(b.dataset.serviceJump); setService(i); $("#services").scrollIntoView({behavior:"smooth"});
}));

function particleCanvas(id,count,network=false){
  const c=document.getElementById(id); if(!c) return;
  const ctx=c.getContext("2d"); let pts=[];
  function resize(){
    const d=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect();
    c.width=r.width*d;c.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);
    pts=Array.from({length:count},()=>({x:Math.random()*r.width,y:Math.random()*r.height,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,r:Math.random()*1.3+.25}));
  }
  function frame(){
    const w=c.clientWidth,h=c.clientHeight;ctx.clearRect(0,0,w,h);
    pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;ctx.fillStyle="rgba(255,255,255,.25)";ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
    if(network){
      ctx.strokeStyle="rgba(255,255,255,.045)";
      for(let i=0;i<pts.length;i+=5)for(let j=i+5;j<pts.length;j+=13){const a=pts[i],b=pts[j],dx=a.x-b.x,dy=a.y-b.y;if(dx*dx+dy*dy<14000){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
    }
    requestAnimationFrame(frame);
  }
  resize();addEventListener("resize",resize);frame();
}
particleCanvas("heroParticles",150,false);
particleCanvas("network",110,true);

const hv=$("#heroVisual"), cards=$$(".art-card",hv);
if(hv && matchMedia("(pointer:fine)").matches){
  hv.addEventListener("mousemove",e=>{
    const r=hv.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;
    cards.forEach(card=>{
      const d=Number(card.dataset.depth||20);
      const base=card.classList.contains("art-a")?"rotate(4deg)":"rotate(-5deg)";
      card.style.transform=`translate3d(${nx*d}px,${ny*d}px,0) ${base}`;
    });
  });
  hv.addEventListener("mouseleave",()=>cards.forEach(card=>card.style.transform=""));
}

const form=$("#projectForm");
if(form) form.addEventListener("submit",e=>{
  e.preventDefault(); if(!form.reportValidity()) return;
  const f=new FormData(form);
  const msg=`Hi Forge Creative, I would like to discuss a graphic design project.

Name: ${f.get("name")}
Company / Brand: ${f.get("company")||"-"}
Country / City: ${f.get("country")}
Project type: ${f.get("type")}

Project summary:
${f.get("summary")}

Deadline: ${f.get("deadline")||"Flexible"}
Budget range: ${f.get("budget")||"To discuss"}
Reference / asset link: ${f.get("reference")||"-"}

Preferred contact: ${f.get("method")}
Contact detail: ${f.get("contact")}`;
  window.open("https://wa.me/8801639444747?text="+encodeURIComponent(msg),"_blank","noopener");
});