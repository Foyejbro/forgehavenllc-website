from pathlib import Path
import base64,json,re
root=Path(__file__).parent
html=(root/'public/index.html').read_text()
logo='data:image/jpeg;base64,'+base64.b64encode((root/'public/assets/forge-haven-logo.jpeg').read_bytes()).decode()
html=html.replace('/assets/forge-haven-logo.jpeg',logo)
html=html.replace('<link rel="stylesheet" href="/styles.css">','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="/config.js" defer></script>','').replace('<script src="/app.js" defer></script>','').replace('<script src="/motion.js" defer></script>','')
policy=(root/'public/policies/index.html').read_text().split('<article class="policy">')[1].split('</article>')[0]
extra='''
const previewPolicy=POLICY_HTML;
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const href=a.getAttribute('href');if(href.startsWith('/products/')){e.preventDefault();const p=products.find(p=>p.id===href.split('/')[2]);if(p)modal(art(p)+'<h2>'+esc(p.title)+'</h2><p>'+esc(p.description)+'</p><p class="muted">'+esc(p.license)+'</p><button class="primary full" data-add="'+esc(p.id)+'">Preview order options · '+money(p.price)+'</button>');}else if(href.startsWith('/policies')){e.preventDefault();modal(previewPolicy);}else if(href.startsWith('/?category=')){e.preventDefault();category=new URL(href,'https://preview.test').searchParams.get('category');render();document.getElementById('products').scrollIntoView();}else if(href==='/'||href.startsWith('/#')){e.preventDefault();const dest=href.split('#')[1];if(dest)document.getElementById(dest)?.scrollIntoView();else window.scrollTo({top:0,behavior:'smooth'});}},true);
'''.replace('POLICY_HTML',json.dumps(policy).replace('</','<\\/'))
html=html.replace('</body>','<script>'+(root/'public/config.js').read_text()+'\nwindow.STORE_CONFIG.apiBase="";</script><script>'+(root/'public/app.js').read_text()+'</script><script>'+(root/'public/motion.js').read_text()+'</script><script>'+extra+'</script></body>')
(root/'START-HERE.html').write_text(html)
print('Standalone interactive preview ready')
