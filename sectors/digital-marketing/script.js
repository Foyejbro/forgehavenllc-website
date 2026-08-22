
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const menu=$('.menu-toggle'), links=$('.nav-links'); if(menu) menu.addEventListener('click',()=>links.classList.toggle('open'));
$$('.nav-drop>button').forEach(b=>b.addEventListener('click',()=>b.parentElement.classList.toggle('open')));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.12}); $$('.reveal').forEach(el=>io.observe(el));
$$('.faq-q').forEach(q=>q.addEventListener('click',()=>q.parentElement.classList.toggle('open')));
$$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;$$('.blog-card').forEach(c=>c.style.display=(f==='all'||c.dataset.cat===f)?'block':'none')}));
const cf=$('#contactForm'); if(cf) cf.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(cf);const msg=`Hi Forge Digital, I have an inquiry.%0A%0AName: ${encodeURIComponent(f.get('name')||'')}%0AEmail: ${encodeURIComponent(f.get('email')||'')}%0APhone: ${encodeURIComponent(f.get('phone')||'')}%0ASubject: ${encodeURIComponent(f.get('subject')||'')}%0AMessage: ${encodeURIComponent(f.get('message')||'')}`;window.open(`https://wa.me/8801639444747?text=${msg}`,'_blank')});
const nf=$('#newsletterForm'); if(nf) nf.addEventListener('submit',e=>{e.preventDefault();const v=$('input',nf).value.trim(); if(v){window.location.href=`mailto:help@forgehavenllc.org?subject=Forge%20Digital%20Updates&body=Please%20add%20${encodeURIComponent(v)}%20to%20the%20updates%20list.`}});
$$('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
