const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let token='',data={},tab='products';

function message(s){$('#message').textContent=s}
async function api(path,body){
  if(!window.STORE_CONFIG?.apiBase)throw Error('Store API is not configured.');
  const r=await fetch(window.STORE_CONFIG.apiBase+'/api/admin/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed.');return d;
}
async function refresh(){data=await api('data');render()}
function exportFile(d,name){const url=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

$('#login').onsubmit=async e=>{e.preventDefault();token=$('#token').value;try{await refresh();$('#login').classList.add('hidden');$('#dashboard').classList.remove('hidden');$('#token').value='';message('Dashboard unlocked.')}catch(e){message(e.message)}};
$('#logout').onclick=()=>location.reload();
$('#export').onclick=()=>exportFile(data.products,'catalog.json');
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});

function render(){
  const c=$('#content');
  if(tab==='products'){
    c.innerHTML='<h2>Products</h2><p class="note">Upload private deliverables to R2, add a public preview, then activate the product.</p><button type="button" id="new">Add product</button>'+data.products.map(p=>`<div class="admin-row"><strong>${esc(p.title)}</strong> · ${esc(p.category)} · $${(p.price/100).toFixed(2)} · ${p.active?'Active':'Inactive'} <button type="button" data-edit="${esc(p.id)}">Edit</button></div>`).join('');
    $('#new').onclick=()=>edit({id:'',title:'',category:'Stock',price:499,delivery:'instant',description:'',license:'',format:'',preview:'',file_key:'',active:false,art:'stock',label:''});
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(data.products.find(p=>p.id===b.dataset.edit)));
  }else if(tab==='orders'){
    c.innerHTML='<h2>Orders</h2>'+data.orders.map(o=>`<div class="admin-row"><strong>${esc(o.name)}</strong> · ${esc(o.email)}<p>${esc(o.id)}<br>${esc(o.method)} · ${esc(o.status)} · $${(o.total/100).toFixed(2)}</p>${JSON.parse(o.items).map(p=>p.delivery==='custom'&&o.status==='paid'?`<button type="button" data-deliver="${esc(o.id)}" data-product="${esc(p.id)}">Deliver ${esc(p.title)}</button>`:'').join('')}${o.method==='relay'&&o.status==='pending'?`<button type="button" data-relay="${esc(o.id)}">Attach Relay payment link</button><button type="button" data-confirm="${esc(o.id)}">Confirm received funds</button>`:''}<button type="button" data-evidence="${esc(o.id)}">Export evidence</button><button type="button" data-revoke="${esc(o.id)}">Revoke downloads</button></div>`).join('');
  }else if(tab==='reviews'){
    c.innerHTML='<h2>Review moderation</h2>'+data.reviews.map((r,i)=>`<div class="admin-row"><strong>${esc(r.display_name)}</strong> · ${r.rating}/5 · ${esc(r.product_title)}<p>${esc(r.text||'Rating only')}</p><button type="button" data-review="${i}" data-approved="${r.approved?'0':'1'}">${r.approved?'Unpublish':'Publish'}</button></div>`).join('');
  }else if(tab==='banner'){
    c.innerHTML='<h2>Promotion banner</h2><form id="banner-form">'+['label','title','text','cta','url','image','big'].map(k=>`<label>${k}<${k==='title'?'textarea':'input'} name="${k}" ${['label','title','text','cta','url'].includes(k)?'required':''}>${k==='title'?'</textarea>':''}</label>`).join('')+'<button class="primary" type="submit">Save banner</button></form>';
    $('#banner-form').onsubmit=async e=>{e.preventDefault();try{await api('banner',Object.fromEntries(new FormData(e.target)));message('Banner saved.')}catch(e){message(e.message)}};
  }
}

function edit(p){
  $('#content').innerHTML='<h2>Edit product</h2><form id="product-form"><div class="form-grid">'+['id','title','price','format','preview','file_key','label'].map(k=>`<label>${k}${k==='price'?' (USD cents: 499 = $4.99)':''}<input name="${k}" value="${esc(p[k])}" ${k==='price'?'type="number" min="50"':''} ${['id','title','price'].includes(k)?'required':''} ${k==='id'&&p.id?'readonly':''}></label>`).join('')+`<label>Category<select name="category">${['Logo','Photograph','Graphic Design','Stock','PSD'].map(x=>`<option ${x===p.category?'selected':''}>${x}</option>`).join('')}</select></label><label>Delivery<select name="delivery"><option value="custom" ${p.delivery==='custom'?'selected':''}>Custom</option><option value="instant" ${p.delivery==='instant'?'selected':''}>Instant</option></select></label></div><label>Description<textarea name="description" required>${esc(p.description)}</textarea></label><label>License<textarea name="license" required>${esc(p.license)}</textarea></label><label class="check"><input name="active" type="checkbox" ${p.active?'checked':''}>Active and ready to sell</label><button class="primary" type="button" id="save-product">Save product</button><p id="save-status" role="status"></p></form>`;
  const save=async()=>{const form=$('#product-form');if(!form.reportValidity())return;const button=$('#save-product'),status=$('#save-status'),d=Object.fromEntries(new FormData(form));button.disabled=true;button.textContent='Saving...';status.textContent='';try{await api('product',{...p,...d,price:Number(d.price),active:d.active==='on'});await refresh();message('Product saved.')}catch(e){status.className='error';status.textContent=e.message}finally{button.disabled=false;button.textContent='Save product'}};
  $('#save-product').onclick=save;
  $('#product-form').onsubmit=e=>{e.preventDefault();save()};
}

$('#content').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.id==='save-product')return;try{if(b.dataset.relay){const url=prompt('Paste the HTTPS Relay payment request link');if(url)await api('order',{id:b.dataset.relay,action:'relay-link',url})}else if(b.dataset.confirm){const reference=prompt('Enter the verified bank transaction ID:');if(reference)await api('order',{id:b.dataset.confirm,action:'confirm-relay',reference})}else if(b.dataset.deliver){const fileKey=prompt('Exact R2 key of the completed customer file:');if(fileKey)await api('order',{id:b.dataset.deliver,action:'deliver',productId:b.dataset.product,fileKey})}else if(b.dataset.revoke){const reason=prompt('Reason for revoking downloads:');if(reason)await api('order',{id:b.dataset.revoke,action:'revoke',reason})}else if(b.dataset.evidence){exportFile(await api('evidence/'+b.dataset.evidence),'order-evidence.json');return}else if(b.dataset.review){const r=data.reviews[+b.dataset.review];await api('review',{orderId:r.order_id,productId:r.product_id,approved:b.dataset.approved==='1'})}else return;await refresh();message('Updated.')}catch(e){message(e.message)}});
