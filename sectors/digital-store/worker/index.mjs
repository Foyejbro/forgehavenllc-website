import policyText from './policy.mjs';

const POLICY='2026-09-22-v1', now=()=>new Date().toISOString(), enc=new TextEncoder();

const json=(v,status=200)=>new Response(JSON.stringify(v),{
  status,
  headers:{'Content-Type':'application/json'}
});

const fail=(m,status=400)=>{
  throw Object.assign(new Error(m),{status});
};

const hash=async s=>Array.from(
  new Uint8Array(
    await crypto.subtle.digest('SHA-256',enc.encode(s))
  )
).map(x=>x.toString(16).padStart(2,'0')).join('');

const random=()=>Array.from(
  crypto.getRandomValues(new Uint8Array(32))
).map(x=>x.toString(16).padStart(2,'0')).join('');

export function equal(a,b){
  if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
  let d=0;
  for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
  return d===0;
}

export async function verifyStripe(raw,signature,secret,clock=Date.now()){
  if(!secret)return false;

  const parts=(signature||'').split(',').map(s=>s.split('='));
  const t=parts.find(p=>p[0]==='t')?.[1];

  if(!/^\d+$/.test(t||'')||Math.abs(clock/1000-Number(t))>300)return false;

  const key=await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    {name:'HMAC',hash:'SHA-256'},
    false,
    ['sign']
  );

  const bytes=new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(t+'.'+raw)
    )
  );

  const h=Array.from(bytes)
    .map(b=>b.toString(16).padStart(2,'0'))
    .join('');

  return parts.some(p=>p[0]==='v1'&&equal(p[1],h));
}

async function body(r){
  const t=await r.text();

  if(t.length>32000)fail('Request too large',413);

  try{
    return JSON.parse(t);
  }catch{
    fail('Invalid JSON');
  }
}

const run=(env,sql,...args)=>env.DB.prepare(sql).bind(...args).run();
const one=(env,sql,...args)=>env.DB.prepare(sql).bind(...args).first();

const all=async(env,sql,...args)=>(
  await env.DB.prepare(sql).bind(...args).all()
).results;

async function event(env,id,type,detail={}){
  await run(
    env,
    'INSERT INTO events(order_id,type,detail,created_at) VALUES(?,?,?,?)',
    id,
    type,
    JSON.stringify(detail),
    now()
  );
}

async function catalog(env){
  return (await all(env,'SELECT data FROM products'))
    .map(p=>JSON.parse(p.data));
}

async function orderAuth(r,env,id){
  const o=await one(env,'SELECT * FROM orders WHERE id=?',id);

  const token=(r.headers.get('Authorization')||'')
    .replace(/^Bearer /,'');

  if(!o||!equal(o.token_hash,await hash(token)))
    fail('Order or access key is incorrect',403);

  return o;
}

async function limit(r,env){
  const ip=r.headers.get('CF-Connecting-IP')||'local';
  const slot=Math.floor(Date.now()/3600000);
  const key=await hash(ip+slot);

  await run(
    env,
    'DELETE FROM rate_limits WHERE expires < ?',
    Date.now()
  );

  const hit=await env.DB.prepare(
    'INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) '+
    'ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count'
  ).bind(
    key,
    Date.now()+3600000
  ).first();

  if(hit.count>30)
    fail('Too many orders. Please try again later.',429);
}

function safeLink(s){
  if(!s)return '';

  try{
    const u=new URL(s);
    if(u.protocol==='https:')return u.href;
  }catch{}

  fail('A valid HTTPS URL is required');
}

function text(s,max=2000){
  return String(s||'').trim().slice(0,max);
}

const html=s=>String(s??'').replace(
  /[&<>"']/g,
  c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c])
);


/* =========================================================
   PAYPAL — NEW
   ========================================================= */

async function paypalAccessToken(env){

  if(!env.PAYPAL_CLIENT_ID||!env.PAYPAL_CLIENT_SECRET)
    fail('PayPal checkout is not configured yet',503);

  const basic=btoa(
    env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET
  );

  const res=await fetch(
    'https://api-m.paypal.com/v1/oauth2/token',
    {
      method:'POST',
      headers:{
        Authorization:'Basic '+basic,
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body:'grant_type=client_credentials'
    }
  );

  const d=await res.json();

  if(!res.ok||!d.access_token)
    fail('PayPal service unavailable. Please try again.',502);

  return d.access_token;
}


async function paypalApi(env,path,options={}){

  const access=await paypalAccessToken(env);

  const res=await fetch(
    'https://api-m.paypal.com'+path,
    {
      ...options,
      headers:{
        Authorization:'Bearer '+access,
        'Content-Type':'application/json',
        ...(options.headers||{})
      }
    }
  );

  let d={};

  try{
    d=await res.json();
  }catch{}

  if(!res.ok)
    fail(
      d?.message||
      'PayPal service unavailable. Please try again.',
      502
    );

  return d;
}


async function verifyPayPalWebhook(r,env,eventData){

  if(!env.PAYPAL_WEBHOOK_ID)return false;

  const access=await paypalAccessToken(env);

  const res=await fetch(
    'https://api-m.paypal.com/v1/notifications/verify-webhook-signature',
    {
      method:'POST',
      headers:{
        Authorization:'Bearer '+access,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        auth_algo:r.headers.get('paypal-auth-algo'),
        cert_url:r.headers.get('paypal-cert-url'),
        transmission_id:r.headers.get('paypal-transmission-id'),
        transmission_sig:r.headers.get('paypal-transmission-sig'),
        transmission_time:r.headers.get('paypal-transmission-time'),
        webhook_id:env.PAYPAL_WEBHOOK_ID,
        webhook_event:eventData
      })
    }
  );

  const d=await res.json();

  return res.ok&&d.verification_status==='SUCCESS';
}


/* =========================================================
   PRODUCT PAGE
   ========================================================= */

function productPage(p){

  const publicProduct={...p};
  delete publicProduct.file_key;

  const products=JSON.stringify([publicProduct])
    .replace(/</g,'\\u003c');

  const money=(p.price/100).toFixed(2);

  return new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${html(p.title)} | Forge Haven LLC</title>

<meta name="description" content="${html(p.description)}">

<link rel="stylesheet" href="/styles.css">
<link rel="icon" href="/assets/forge-haven-logo.png">

<script>window.INITIAL_PRODUCTS=${products}</script>

<script src="/config.js" defer></script>
<script src="/app.js" defer></script>
<script src="/motion.js" defer></script>

</head>

<body>

<header class="header">

<div class="wrap nav">

<a class="brand" href="/">
<img src="/assets/forge-haven-logo.png"
alt="Forge Haven LLC logo">
</a>

<nav>
<a href="/">Home</a>
<a href="/#products">Products</a>
</nav>

<div class="nav-actions">

<button data-action="purchases">
My purchases
</button>

<button data-action="cart">
Cart <span id="cart-count">0</span>
</button>

</div>

</div>

</header>

<main>

<div class="wrap">

<p class="muted">
<a href="/">Home</a> /
${html(p.category)} /
${html(p.title)}
</p>

<section class="product-detail">

<div class="art">
<img
src="${html(p.preview)}"
alt="${html(p.title)} preview">
</div>

<div>

<span class="eyebrow">
${html(p.category)} ·
${p.delivery==='custom'
?'CUSTOM ORDER'
:'DIGITAL DOWNLOAD'}
</span>

<h1>${html(p.title)}</h1>

<p>${html(p.description)}</p>

<p>${html(p.format)}</p>

<div class="price">
$${money}
<small class="muted">USD</small>
</div>

<button
class="primary full"
data-add="${html(p.id)}">
${p.delivery==='custom'
?'Customize & order'
:'Add to cart'}
</button>

<p class="note">
<strong>NON-REFUNDABLE.</strong>
<a class="link" href="/policies/">
Read policy
</a>
</p>

<h3>License included</h3>

<p>${html(p.license)}</p>

</div>

</section>

</div>

</main>

<dialog id="modal">
<button class="close">×</button>
<div id="modal-content"></div>
</dialog>

<div id="toast"></div>

</body>
</html>`,{
    headers:{
      'Content-Type':'text/html; charset=UTF-8',
      'Cache-Control':'no-store'
    }
  });
}


/* =========================================================
   PRODUCT VALIDATION
   ========================================================= */

export function validateProduct(p){

  if(!/^[a-z0-9-]{1,80}$/.test(p.id))
    fail('Use a lowercase product ID with hyphens');

  if(![
    'Logo',
    'Photograph',
    'Graphic Design',
    'Stock',
    'PSD'
  ].includes(p.category))
    fail('Invalid category');

  if(
    !Number.isSafeInteger(p.price)||
    p.price<50||
    p.price>10000000
  )
    fail('Invalid price (USD cents)');

  if(
    !['custom','instant'].includes(p.delivery)||
    !p.title||
    !p.description||
    !p.license
  )
    fail('Complete all product details');

  if(
    p.category==='Logo'&&
    p.delivery!=='custom'
  )
    fail('Logo orders must be custom');

  if(
    p.active&&
    (
      !p.preview||
      (
        p.delivery==='instant'&&
        !p.file_key
      )
    )
  )
    fail(
      'Active products require a preview and '+
      'instant products require a private file'
    );

  if(p.preview)safeLink(p.preview);

  return p;
}


/* =========================================================
   ROUTES
   ========================================================= */

async function route(r,env){

  const u=new URL(r.url);
  const path=u.pathname;
  const method=r.method;


  /* CATALOG */

  if(path==='/api/catalog'&&method==='GET'){

    const products=(await catalog(env))
      .map(({file_key,...p})=>p);

    const b=await one(
      env,
      "SELECT value FROM settings WHERE key='banner'"
    );

    return json({
      products,
      banner:b?JSON.parse(b.value):null
    });
  }


  /* REVIEWS */

  if(path==='/api/reviews'&&method==='GET'){

    return json(
      await all(
        env,
        'SELECT product_id,product_title,rating,'+
        'display_name,text,created_at '+
        'FROM reviews WHERE approved=1 '+
        'ORDER BY created_at DESC LIMIT 60'
      )
    );
  }


  /* =====================================================
     STRIPE WEBHOOK — EXISTING
     ===================================================== */

  if(path==='/api/stripe/webhook'&&method==='POST'){

    const raw=await r.text();

    if(
      !await verifyStripe(
        raw,
        r.headers.get('stripe-signature'),
        env.STRIPE_WEBHOOK_SECRET
      )
    )
      fail('Invalid webhook signature',400);

    const e=JSON.parse(raw);
    const s=e.data?.object;

    if(
      e.type==='checkout.session.completed'||
      e.type==='checkout.session.async_payment_succeeded'
    ){

      if(s.payment_status==='paid'){

        const o=await one(
          env,
          'SELECT * FROM orders WHERE id=?',
          s.metadata?.order_id||''
        );

        if(
          !o||
          o.method!=='stripe'||
          o.stripe_session!==s.id||
          s.amount_total!==o.total||
          s.currency!==o.currency
        )
          fail('Order mismatch',409);

        await run(
          env,
          "UPDATE orders SET status='paid',"+
          "payment_reference=? "+
          "WHERE id=? AND status='pending'",
          String(s.payment_intent||s.id),
          o.id
        );

        await event(
          env,
          o.id,
          'stripe_payment_confirmed',
          {
            event:e.id,
            session:s.id,
            total:s.amount_total
          }
        );
      }
    }

    if(e.type==='charge.refunded'){

      const o=await one(
        env,
        'SELECT * FROM orders WHERE payment_reference=?',
        String(s.payment_intent||'')
      );

      if(o){

        await run(
          env,
          "UPDATE orders SET status='refunded' WHERE id=?",
          o.id
        );

        await event(
          env,
          o.id,
          'stripe_refund',
          {event:e.id}
        );
      }
    }

    if(e.type==='charge.dispute.created'){

      const o=await one(
        env,
        'SELECT * FROM orders WHERE payment_reference=?',
        String(s.payment_intent||'')
      );

      if(o){

        await run(
          env,
          "UPDATE orders SET status='disputed' WHERE id=?",
          o.id
        );

        await event(
          env,
          o.id,
          'stripe_dispute',
          {event:e.id}
        );
      }
    }

    return json({received:true});
  }


  /* =====================================================
     PAYPAL WEBHOOK — NEW
     ===================================================== */

  if(path==='/api/paypal/webhook'&&method==='POST'){

    const raw=await r.text();

    let e;

    try{
      e=JSON.parse(raw);
    }catch{
      fail('Invalid JSON');
    }

    if(!await verifyPayPalWebhook(r,env,e))
      fail('Invalid PayPal webhook signature',400);

    const s=e.resource||{};

    const captureId=String(s.id||'');

    const customId=String(
      s.custom_id||
      s.supplementary_data?.related_ids?.order_id||
      ''
    );

    let o=customId
      ?await one(
        env,
        'SELECT * FROM orders WHERE id=?',
        customId
      )
      :null;

    if(!o&&captureId){

      o=await one(
        env,
        'SELECT * FROM orders WHERE payment_reference=?',
        captureId
      );
    }


    /* PAYPAL PAYMENT COMPLETED */

    if(
      e.event_type==='PAYMENT.CAPTURE.COMPLETED'&&
      o&&
      o.method==='paypal'
    ){

      const expected=(o.total/100).toFixed(2);

      if(
        String(
          s.amount?.currency_code||''
        ).toUpperCase()!=='USD'||
        String(s.amount?.value||'')!==expected
      )
        fail('Order mismatch',409);

      await run(
        env,
        "UPDATE orders SET status='paid',"+
        "payment_reference=? "+
        "WHERE id=? AND status='pending'",
        captureId,
        o.id
      );

      await event(
        env,
        o.id,
        'paypal_payment_confirmed',
        {
          event:e.id,
          capture:captureId,
          total:s.amount?.value
        }
      );
    }


    /* PAYPAL REFUND / REVERSAL */

    if(
      (
        e.event_type==='PAYMENT.CAPTURE.REFUNDED'||
        e.event_type==='PAYMENT.CAPTURE.REVERSED'
      )&&
      o&&
      o.method==='paypal'
    ){

      await run(
        env,
        "UPDATE orders SET status=? WHERE id=?",
        e.event_type==='PAYMENT.CAPTURE.REFUNDED'
          ?'refunded'
          :'revoked',
        o.id
      );

      await event(
        env,
        o.id,
        e.event_type==='PAYMENT.CAPTURE.REFUNDED'
          ?'paypal_refund'
          :'paypal_reversal',
        {
          event:e.id,
          capture:captureId
        }
      );
    }


    /* PAYPAL DECLINED */

    if(
      e.event_type==='PAYMENT.CAPTURE.DECLINED'&&
      o&&
      o.method==='paypal'
    ){

      await run(
        env,
        "UPDATE orders SET status='failed' "+
        "WHERE id=? AND status='pending'",
        o.id
      );

      await event(
        env,
        o.id,
        'paypal_capture_declined',
        {
          event:e.id,
          capture:captureId
        }
      );
    }

    return json({received:true});
  }


  /* =====================================================
     PAYPAL CAPTURE AFTER RETURN — NEW
     ===================================================== */

  if(path==='/api/paypal/capture'&&method==='POST'){

    const d=await body(r);

    const id=text(d.id,80);
    const paypalOrderId=text(d.paypalOrderId,80);

    if(!id||!paypalOrderId)
      fail('Invalid PayPal return');

    const o=await one(
      env,
      'SELECT * FROM orders WHERE id=?',
      id
    );

    if(
      !o||
      o.method!=='paypal'||
      o.status!=='pending'||
      o.stripe_session!==paypalOrderId
    )
      fail('Order mismatch',409);


    const result=await paypalApi(
      env,
      '/v2/checkout/orders/'+
      encodeURIComponent(paypalOrderId)+
      '/capture',
      {
        method:'POST',
        headers:{
          'PayPal-Request-Id':id+'-capture'
        },
        body:'{}'
      }
    );


    const cap=
      result.purchase_units?.[0]
        ?.payments?.captures?.[0];


    if(
      result.status!=='COMPLETED'||
      cap?.status!=='COMPLETED'
    )
      fail('PayPal payment is not completed',409);


    const expected=(o.total/100).toFixed(2);


    if(
      String(
        cap.amount?.currency_code||''
      ).toUpperCase()!=='USD'||
      String(cap.amount?.value||'')!==expected||
      String(
        result.purchase_units?.[0]?.custom_id||''
      )!==id
    )
      fail('Order mismatch',409);


    await run(
      env,
      "UPDATE orders SET status='paid',"+
      "payment_reference=? "+
      "WHERE id=? AND status='pending'",
      String(cap.id),
      id
    );


    await event(
      env,
      id,
      'paypal_payment_confirmed',
      {
        order:paypalOrderId,
        capture:cap.id,
        total:cap.amount?.value
      }
    );


    return json({
      id,
      status:'paid'
    });
  }


  /* =====================================================
     CHECKOUT — STRIPE + PAYPAL + RELAY
     ===================================================== */

  if(path==='/api/checkout'&&method==='POST'){

    const d=await body(r);


    if(
      d.accepted!==true||
      d.policyVersion!==POLICY
    )
      fail('Please accept the current policies');


    if(!['stripe','paypal','relay'].includes(d.method))
      fail('Invalid payment method');


    if(
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        d.email||''
      )||
      !text(d.name)
    )
      fail('Valid name and email are required');


    if(
      !Array.isArray(d.items)||
      !d.items.length||
      d.items.length>20
    )
      fail('Invalid cart');


    if(
      new Set(
        d.items.map(x=>x.id)
      ).size!==d.items.length
    )
      fail('Duplicate products');


    if(
      d.method==='stripe'&&
      !env.STRIPE_SECRET_KEY
    )
      fail(
        'Card checkout is not configured yet',
        503
      );


    if(
      d.method==='paypal'&&
      (
        !env.PAYPAL_CLIENT_ID||
        !env.PAYPAL_CLIENT_SECRET
      )
    )
      fail(
        'PayPal checkout is not configured yet',
        503
      );


    await limit(r,env);


    const ps=await catalog(env);
    const items=[];


    for(const requested of d.items){

      const p=ps.find(
        x=>x.id===requested.id
      );

      if(!p||!p.active)
        fail('A product is unavailable');


      validateProduct(p);


      if(
        p.delivery==='custom'&&
        !text(requested.company,150)
      )
        fail('Company name is required');


      if(
        p.delivery==='instant'&&
        !await env.FILES.head(p.file_key)
      )
        fail(
          'Product file is unavailable. Contact support.',
          409
        );


      items.push({
        ...p,
        company:text(
          requested.company,
          150
        ),
        tagline:text(
          requested.tagline,
          150
        ),
        instructions:text(
          requested.instructions
        ),
        ready:p.delivery==='instant',
        file_key:
          p.delivery==='instant'
            ?p.file_key
            :''
      });
    }


    const total=items.reduce(
      (s,p)=>s+p.price,
      0
    );

    const id=crypto.randomUUID();
    const token=random();


    await run(
      env,
      'INSERT INTO orders('+
      'id,token_hash,name,email,method,total,'+
      'items,policy_version,accepted_at,created_at'+
      ') VALUES(?,?,?,?,?,?,?,?,?,?)',
      id,
      await hash(token),
      text(d.name,120),
      text(d.email,254),
      d.method,
      total,
      JSON.stringify(items),
      POLICY,
      now(),
      now()
    );


    await event(
      env,
      id,
      'policy_accepted',
      {
        version:POLICY,
        policyText,
        items:items.map(
          p=>({
            id:p.id,
            license:p.license
          })
        ),
        deliveryRequested:true
      }
    );


    /* RELAY — EXISTING */

    if(d.method==='relay')
      return json({
        id,
        token
      });


    /* ===============================================
       PAYPAL CREATE ORDER — NEW
       =============================================== */

    if(d.method==='paypal'){

      const pp=await paypalApi(
        env,
        '/v2/checkout/orders',
        {
          method:'POST',

          headers:{
            'PayPal-Request-Id':id
          },

          body:JSON.stringify({

            intent:'CAPTURE',

            purchase_units:[
              {
                reference_id:id,
                custom_id:id,

                amount:{
                  currency_code:'USD',
                  value:(total/100).toFixed(2)
                },

                description:
                  'Forge Haven LLC digital order'
              }
            ],

            payment_source:{
              paypal:{
               experience_context:{
  brand_name:'Forge Haven LLC',
  user_action:'PAY_NOW',
  landing_page:'GUEST_CHECKOUT',

  return_url:
    env.STORE_ORIGIN+
    '/?paypal=return&order='+
    encodeURIComponent(id),

  cancel_url:
    env.STORE_ORIGIN+
    '/?order='+
    encodeURIComponent(id)
}
                }
              }
            }

          })
        }
      );


      const approve=pp.links?.find(
        x=>
          x.rel==='payer-action'||
          x.rel==='approve'
      )?.href;


      if(!pp.id||!approve){

        await run(
          env,
          "UPDATE orders SET status='failed' WHERE id=?",
          id
        );

        fail(
          'PayPal service unavailable. Please try again.',
          502
        );
      }


      /*
       Existing stripe_session column is reused to store
       PayPal order ID so no DB schema change is required.
      */

      await run(
        env,
        'UPDATE orders SET stripe_session=? WHERE id=?',
        pp.id,
        id
      );


      return json({
        id,
        token,
        url:approve
      });
    }


    /* ===============================================
       STRIPE — EXISTING
       =============================================== */

    const params=new URLSearchParams({

      mode:'payment',

      customer_email:
        text(d.email,254),

      'payment_method_types[0]':
        'card',

      'payment_method_types[1]':
        'us_bank_account',

      success_url:
        env.STORE_ORIGIN+
        '/?order='+id,

      cancel_url:
        env.STORE_ORIGIN+
        '/?order='+id,

      'metadata[order_id]':
        id,

      'payment_intent_data[metadata][order_id]':
        id,

      client_reference_id:
        id
    });


    items.forEach((p,i)=>{

      params.set(
        `line_items[${i}][price_data][currency]`,
        'usd'
      );

      params.set(
        `line_items[${i}][price_data][unit_amount]`,
        String(p.price)
      );

      params.set(
        `line_items[${i}][price_data][product_data][name]`,
        p.title
      );

      params.set(
        `line_items[${i}][quantity]`,
        '1'
      );
    });


    const res=await fetch(
      'https://api.stripe.com/v1/checkout/sessions',
      {
        method:'POST',

        headers:{
          Authorization:
            'Bearer '+env.STRIPE_SECRET_KEY,

          'Content-Type':
            'application/x-www-form-urlencoded',

          'Idempotency-Key':
            id
        },

        body:params
      }
    );


    const s=await res.json();


    if(!res.ok||!s.url){

      await run(
        env,
        "UPDATE orders SET status='failed' WHERE id=?",
        id
      );

      fail(
        'Payment service unavailable. Please try again.',
        502
      );
    }


    await run(
      env,
      'UPDATE orders SET stripe_session=? WHERE id=?',
      s.id,
      id
    );


    return json({
      id,
      token,
      url:s.url
    });
  }


  /* =====================================================
     ORDERS — EXISTING
     ===================================================== */

  const match=path.match(
    /^\/api\/orders\/([a-f0-9-]+)(?:\/(.*))?$/
  );


  if(match){

    const o=await orderAuth(
      r,
      env,
      match[1]
    );

    const action=match[2]||'';

    const items=JSON.parse(o.items);


    if(!action&&method==='GET'){

      return json({
        id:o.id,
        status:o.status,
        method:o.method,
        total:o.total,

        items:items.map(
          ({file_key,...p})=>p
        ),

        relayUrl:o.relay_url||'',

        relayInstructions:
          env.RELAY_INSTRUCTIONS||'',

        paymentReference:
          o.payment_reference
      });
    }


    if(
      action==='reference'&&
      method==='POST'
    ){

      if(
        o.method!=='relay'||
        o.status!=='pending'
      )
        fail(
          'This order cannot accept a payment reference'
        );


      const d=await body(r);

      const reference=text(
        d.reference,
        200
      );


      if(!reference)
        fail('Reference is required');


      await run(
        env,
        'UPDATE orders SET payment_reference=? WHERE id=?',
        reference,
        o.id
      );


      await event(
        env,
        o.id,
        'customer_payment_reference',
        {reference}
      );


      return json({ok:true});
    }


    if(
      action==='review'&&
      method==='POST'
    ){

      if(o.status!=='paid')
        fail(
          'Only paid customers can review',
          403
        );


      const d=await body(r);

      const p=items.find(
        p=>p.id===d.productId
      );

      const rating=Number(d.rating);


      if(
        !p||
        !Number.isInteger(rating)||
        rating<1||
        rating>5||
        !text(d.displayName,60)
      )
        fail('Invalid review');


      await run(
        env,
        'INSERT INTO reviews('+
        'order_id,product_id,product_title,'+
        'rating,display_name,text,created_at'+
        ') VALUES(?,?,?,?,?,?,?) '+
        'ON CONFLICT(order_id,product_id) '+
        'DO UPDATE SET '+
        'rating=excluded.rating,'+
        'display_name=excluded.display_name,'+
        'text=excluded.text,'+
        'approved=0',
        o.id,
        p.id,
        p.title,
        rating,
        text(d.displayName,60),
        text(d.text),
        now()
      );


      return json({ok:true});
    }


    if(
      action==='receipt'&&
      method==='GET'
    ){

      if(o.status!=='paid')
        fail(
          'License is issued after payment confirmation',
          403
        );


      return new Response(
`FORGE HAVEN LLC — LICENSE RECEIPT
Order: ${o.id}
Licensed to: ${o.name} (${o.email})
Payment: ${o.method} / ${o.payment_reference||o.received_reference||''}
Total: USD ${(o.total/100).toFixed(2)}
Policy: ${o.policy_version}
Accepted: ${o.accepted_at}

${items.map(
  p=>p.title+'\n'+p.license
).join('\n\n')}

Copyright remains with the creator. support@forgehavenllc.org`,
        {
          headers:{
            'Content-Type':
              'text/plain; charset=utf-8',

            'Content-Disposition':
              'attachment; filename="forge-haven-license.txt"'
          }
        }
      );
    }


    if(
      action.startsWith('download/')&&
      method==='GET'
    ){

      if(o.status!=='paid')
        fail(
          'Payment is not confirmed',
          403
        );


      const p=items.find(
        p=>p.id===action.slice(9)
      );


      if(!p?.ready||!p.file_key)
        fail(
          'File is not ready',
          404
        );


      const obj=await env.FILES.get(
        p.file_key
      );


      if(!obj)
        fail(
          'File unavailable. Please contact support.',
          404
        );


      await event(
        env,
        o.id,
        'download_served',
        {
          productId:p.id,
          key:p.file_key
        }
      );


      const h=new Headers();

      obj.writeHttpMetadata(h);

      h.set(
        'Content-Disposition',
        'attachment; filename="'+
        p.file_key
          .split('/')
          .pop()
          .replace(
            /[^a-zA-Z0-9._-]/g,
            '_'
          )+
        '"'
      );

      h.set(
        'Content-Type',
        'application/octet-stream'
      );


      return new Response(
        obj.body,
        {headers:h}
      );
    }


    fail('Not found',404);
  }


  /* =====================================================
     ADMIN — EXISTING
     ===================================================== */

  if(path.startsWith('/api/admin/')){

    const token=(
      r.headers.get('Authorization')||''
    ).replace(/^Bearer /,'');


    if(
      !env.ADMIN_TOKEN||
      env.ADMIN_TOKEN.length<32||
      !equal(token,env.ADMIN_TOKEN)
    )
      fail('Unauthorized',401);


    const action=path.slice(11);


    if(
      action==='data'&&
      method==='GET'
    ){

      return json({

        products:
          await catalog(env),

        orders:
          await all(
            env,
            'SELECT id,name,email,method,status,total,'+
            'items,payment_reference,received_reference,'+
            'relay_url,created_at '+
            'FROM orders ORDER BY created_at DESC LIMIT 200'
          ),

        reviews:
          await all(
            env,
            'SELECT * FROM reviews '+
            'ORDER BY created_at DESC LIMIT 200'
          )
      });
    }


    if(
      action==='product'&&
      method==='POST'
    ){

      const p=validateProduct(
        await body(r)
      );


      if(
        p.active&&
        p.delivery==='instant'&&
        !await env.FILES.head(p.file_key)
      )
        fail(
          'Upload the file to R2 first'
        );


      await run(
        env,
        'INSERT INTO products(id,data) VALUES(?,?) '+
        'ON CONFLICT(id) DO UPDATE SET data=excluded.data',
        p.id,
        JSON.stringify(p)
      );


      return json({ok:true});
    }


    if(
      action==='banner'&&
      method==='POST'
    ){

      const b=await body(r);

      b.url=safeLink(b.url);

      if(b.image)
        b.image=safeLink(b.image);


      await run(
        env,
        "INSERT INTO settings(key,value) "+
        "VALUES('banner',?) "+
        "ON CONFLICT(key) "+
        "DO UPDATE SET value=excluded.value",
        JSON.stringify(b)
      );


      return json({ok:true});
    }


    if(
      action==='order'&&
      method==='POST'
    ){

      const d=await body(r);

      const o=await one(
        env,
        'SELECT * FROM orders WHERE id=?',
        d.id
      );


      if(!o)
        fail(
          'Order not found',
          404
        );


      if(d.action==='relay-link'){

        if(
          o.method!=='relay'||
          o.status!=='pending'
        )
          fail(
            'Only pending Relay orders'
          );


        const link=safeLink(d.url);


        await run(
          env,
          'UPDATE orders SET relay_url=? WHERE id=?',
          link,
          o.id
        );


        await event(
          env,
          o.id,
          'relay_request_added',
          {url:link}
        );

      }else if(
        d.action==='confirm-relay'
      ){

        if(
          o.method!=='relay'||
          o.status!=='pending'||
          !text(d.reference,200)
        )
          fail(
            'Verify received funds and enter transaction reference'
          );


        await run(
          env,
          "UPDATE orders SET status='paid',"+
          "received_reference=? "+
          "WHERE id=? AND status='pending'",
          text(d.reference,200),
          o.id
        );


        await event(
          env,
          o.id,
          'admin_relay_verified',
          {
            reference:
              text(d.reference,200)
          }
        );

      }else if(
        d.action==='deliver'
      ){

        if(o.status!=='paid')
          fail(
            'Payment must be confirmed first'
          );


        const items=JSON.parse(
          o.items
        );


        const p=items.find(
          x=>
            x.id===d.productId&&
            x.delivery==='custom'
        );


        if(
          !p||
          !d.fileKey||
          !await env.FILES.head(d.fileKey)
        )
          fail(
            'Upload the custom file to R2 first'
          );


        p.file_key=text(
          d.fileKey,
          500
        );

        p.ready=true;


        await run(
          env,
          'UPDATE orders SET items=? WHERE id=?',
          JSON.stringify(items),
          o.id
        );


        await event(
          env,
          o.id,
          'custom_delivered',
          {
            productId:p.id,
            key:p.file_key
          }
        );

      }else if(
        d.action==='revoke'
      ){

        await run(
          env,
          "UPDATE orders SET status='revoked' WHERE id=?",
          o.id
        );


        await event(
          env,
          o.id,
          'access_revoked',
          {
            reason:text(d.reason)
          }
        );

      }else{

        fail(
          'Unknown order action'
        );
      }


      return json({ok:true});
    }


    if(
      action==='review'&&
      method==='POST'
    ){

      const d=await body(r);


      await run(
        env,
        'UPDATE reviews SET approved=? '+
        'WHERE order_id=? AND product_id=?',
        d.approved?1:0,
        d.orderId,
        d.productId
      );


      return json({ok:true});
    }


    if(
      action.startsWith('evidence/')&&
      method==='GET'
    ){

      const id=action.slice(9);


      const o=await one(
        env,
        'SELECT * FROM orders WHERE id=?',
        id
      );


      if(!o)
        fail(
          'Not found',
          404
        );


      delete o.token_hash;


      return json({

        order:o,

        events:
          await all(
            env,
            'SELECT * FROM events '+
            'WHERE order_id=? ORDER BY id',
            id
          )
      });
    }


    fail('Not found',404);
  }


  fail('Not found',404);
}


/* =========================================================
   WORKER
   ========================================================= */

export default {

  async fetch(r,env){

    const path=new URL(r.url).pathname;


    if(!path.startsWith('/api/')){

      const match=path.match(
        /^\/products\/([a-z0-9-]+)\/?$/
      );


      if(
        match&&
        r.method==='GET'
      ){

        try{

          const p=(
            await catalog(env)
          ).find(
            x=>x.id===match[1]
          );


          if(p?.active)
            return productPage(p);

        }catch{}
      }


      return env.ASSETS.fetch(r);
    }


    const origin=
      r.headers.get('Origin');

    let response;


    try{

      if(
        origin&&
        origin!==env.STORE_ORIGIN
      )
        fail(
          'Origin not allowed',
          403
        );


      if(r.method==='OPTIONS'){

        response=new Response(
          null,
          {status:204}
        );

      }else{

        response=await route(
          r,
          env
        );
      }

    }catch(e){

      response=json(
        {
          error:
            e.status
              ?e.message
              :'Server error. Please contact support.'
        },
        e.status||500
      );
    }


    const h=new Headers(
      response.headers
    );


    h.set(
      'Cache-Control',
      'no-store'
    );

    h.set(
      'X-Content-Type-Options',
      'nosniff'
    );

    h.set(
      'Referrer-Policy',
      'no-referrer'
    );


    if(origin===env.STORE_ORIGIN){

      h.set(
        'Access-Control-Allow-Origin',
        origin
      );

      h.set(
        'Vary',
        'Origin'
      );

      h.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );

      h.set(
        'Access-Control-Allow-Methods',
        'GET,POST,OPTIONS'
      );

      h.set(
        'Access-Control-Expose-Headers',
        'Content-Disposition'
      );
    }


    return new Response(
      response.body,
      {
        status:response.status,
        headers:h
      }
    );
  }
};
