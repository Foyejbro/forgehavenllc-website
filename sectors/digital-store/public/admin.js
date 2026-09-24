function edit(p){
  $('#content').innerHTML='<h2>Edit product</h2><form id="product-form"><div class="form-grid">'+
  ['id','title','price','format','preview','file_key','label'].map(k=>`<label>${k}${k==='price'?' (USD cents: 499 = $4.99)':''}<input name="${k}" value="${esc(p[k])}" ${k==='price'?'type="number" min="50"':''} ${['id','title','price'].includes(k)?'required':''} ${k==='id'&&p.id?'readonly':''}></label>`).join('')+
  `<label>Category<select name="category">${['Logo','Photograph','Graphic Design','Stock','PSD'].map(x=>`<option ${x===p.category?'selected':''}>${x}</option>`).join('')}</select></label>
  <label>Delivery<select name="delivery"><option value="custom" ${p.delivery==='custom'?'selected':''}>Custom</option><option value="instant" ${p.delivery==='instant'?'selected':''}>Instant</option></select></label>
  </div><label>Description<textarea name="description" required>${esc(p.description)}</textarea></label>
  <label>License<textarea name="license" required>${esc(p.license)}</textarea></label>
  <label class="check"><input name="active" type="checkbox" ${p.active?'checked':''}>Active and ready to sell</label>
  <button class="primary" type="button" id="save-product">Save product</button>
  <p id="save-status"></p></form>`;

  const save=async()=>{
    const form=$('#product-form');
    if(!form.reportValidity())return;

    const button=$('#save-product');
    const status=$('#save-status');
    const d=Object.fromEntries(new FormData(form));

    button.disabled=true;
    button.textContent='Saving…';
    status.textContent='';

    try{
      await api('product',{...p,...d,price:Number(d.price),active:d.active==='on'});
      await refresh();
      message('Product saved.');
    }catch(e){
      status.className='error';
      status.textContent=e.message;
    }finally{
      button.disabled=false;
      button.textContent='Save product';
    }
  };

  $('#save-product').onclick=save;
  $('#product-form').onsubmit=e=>{e.preventDefault();save()};
}
