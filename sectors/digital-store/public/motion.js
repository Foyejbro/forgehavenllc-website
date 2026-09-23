/* Progressive enhancement: the store works and remains visible without motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const toggle = document.getElementById('banner-toggle');
  const observed = new WeakSet();
  const play = (node, frames, options) => {
    if (reduce.matches || !node?.animate) return;
    node.animate(frames, {duration: 480, easing: 'cubic-bezier(.22,1,.36,1)', ...options});
  };
  let paused = reduce.matches, hover = false, focused = false, current = 0, timer;
  const updateToggle = () => {
    if (!toggle) return;
    const off = paused || reduce.matches;
    toggle.textContent = off ? 'Play' : 'Pause';
    toggle.setAttribute('aria-pressed', String(off));
    toggle.setAttribute('aria-label', off ? 'Play banner rotation' : 'Pause banner rotation');
  };
  const schedule = () => {
    clearTimeout(timer);
    if (!hero || paused || reduce.matches || hover || focused || document.hidden) return;
    timer = setTimeout(() => {
      if (document.getElementById('modal')?.open) { schedule(); return; }
      current = (current + 1) % 2;
      if (typeof slide === 'function') slide(current);
      schedule();
    }, 7000);
  };
  toggle?.addEventListener('click', () => { paused = !paused; updateToggle(); schedule(); });
  hero?.addEventListener('pointerenter', () => { hover = true; schedule(); });
  hero?.addEventListener('pointerleave', () => { hover = false; schedule(); });
  hero?.addEventListener('focusin', () => { focused = true; schedule(); });
  hero?.addEventListener('focusout', e => { if (!hero.contains(e.relatedTarget)) { focused = false; schedule(); } });
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('store:slide', e => {
    current = e.detail;
    document.querySelectorAll('[data-slide]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.slide === current)));
    play(document.querySelector('.hero-copy'), [{opacity:.25,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}], {duration:550});
    schedule();
  });
  reduce.addEventListener('change', () => { updateToggle(); schedule(); });
  updateToggle(); schedule();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const n = entry.target;
      play(n, [{opacity:.25,transform:'translateY(19px)'},{opacity:1,transform:'translateY(0)'}], {duration:650,delay:Number(n.dataset.motionDelay||0)});
      observer.unobserve(n);
    });
  }, {threshold:.08}) : null;
  function scan() {
    document.querySelectorAll('.card,.category-tile,.section-heading,.review-card,.about,.service-strip').forEach((n,i) => {
      if(observed.has(n)) return;
      observed.add(n);n.dataset.motionDelay=String((i%4)*45);observer?.observe(n);
    });
  }
  scan();
  ['product-grid','review-grid'].forEach(id => {
    const grid=document.getElementById(id);
    if(grid)new MutationObserver(scan).observe(grid,{childList:true});
  });
  const count=document.getElementById('cart-count');
  if(count)new MutationObserver(()=>play(count,[{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:320})).observe(count,{childList:true});
  const dialog=document.getElementById('modal');
  if(dialog)new MutationObserver(()=>{
    if(dialog.open)play(dialog,[{opacity:0,transform:'translateY(12px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:240});
  }).observe(dialog,{attributes:true,attributeFilter:['open']});
  let ticking=false;
  const scrollHeader=()=>{
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{document.querySelector('.header')?.classList.toggle('is-scrolled',scrollY>20);ticking=false;});
  };
  window.addEventListener('scroll',scrollHeader,{passive:true});scrollHeader();
  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest('button,.button');
    if(b&&!b.disabled)play(b,[{transform:'scale(1)'},{transform:'scale(.965)'},{transform:'scale(1)'}],{duration:210});
  });
})();
