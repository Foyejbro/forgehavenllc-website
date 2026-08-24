
const menu=document.getElementById('menuBtn'),nav=document.getElementById('navMenu');
if(menu&&nav)menu.onclick=()=>nav.classList.toggle('open');

const slides=[...document.querySelectorAll('.slide')],dots=[...document.querySelectorAll('.slider-dots button')],count=document.getElementById('slideCount');
let si=0,timer;
function showSlide(i){if(!slides.length)return;si=(i+slides.length)%slides.length;slides.forEach((s,n)=>s.classList.toggle('active',n===si));dots.forEach((d,n)=>d.classList.toggle('active',n===si));if(count)count.textContent=String(si+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0')}
function auto(){clearInterval(timer);timer=setInterval(()=>showSlide(si+1),2000)}
dots.forEach((d,i)=>d.onclick=()=>{showSlide(i);auto()});showSlide(0);auto();

const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(x=>obs.observe(x));

const methodRadios=[...document.querySelectorAll('input[name="contact_method"]')];
const detail=document.getElementById('methodDetails'),label=document.getElementById('methodLabel'),input=document.getElementById('methodInput');
function syncMethod(){
  if(!detail||!label||!input)return;
  const selected=document.querySelector('input[name="contact_method"]:checked');
  if(!selected)return;
  const v=selected.value; detail.classList.add('show');
  label.textContent=v==='Phone Call'?'Phone number *':v==='WhatsApp'?'WhatsApp number *':'Email address *';
  input.type=v==='Email'?'email':'text';
  input.placeholder=v==='Email'?'you@example.com':'+country code ...';
}
methodRadios.forEach(r=>r.addEventListener('change',syncMethod));syncMethod();

const form=document.getElementById('appointmentForm'),modal=document.getElementById('thanksModal');
if(form)form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!form.reportValidity()) return;
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  form.reset();document.getElementById('cm-whatsapp').checked=true;syncMethod();
});
document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')});
