## UI/UX refinement

Added subtle scroll reveal, hover transitions, cart feedback, dialog animation, seven-second banner rotation with pause and reduced-motion support. Checkout now shows item summary, total, back navigation, method-specific instructions and loading feedback. No new images generated. Browser visual QA is still pending because the browser runtime could not be installed.

# Forge Haven Digital Store — Reference layout revision

Updated layout: compact dark header, full-width banner, five category cards, white product area, four desktop columns / two mobile columns, cyan purchase buttons, verified reviews and footer. No generated images added. Banner image is optional and can be set from admin.

## শুরু করার নির্দেশনা

আপনার dark / white / cyan mini-store-এর frontend ও Cloudflare backend এই ZIP-এ আছে। Original green/white logo অপরিবর্তিত রাখা হয়েছে। দেওয়া ফাইলটি JPEG, তাই white background-সহ ব্যবহার করা হয়েছে; এটিকে transparent PNG বলে দেখানো হয়নি।

## প্রথমে design দেখুন

ZIP extract করে START-HERE.html browser-এ খুলুন। এটি self-contained interactive design preview; live store নয়। Category, search, logo customization, cart ও checkout preview দেখা যাবে।

পূর্ণ site local preview করতে Node.js 24 এবং Python 3 থাকলে:

```bash
npm run build
npm run preview
```

Browser: http://localhost:3000

## কী তৈরি হয়েছে

- Home / About / Back to main site / Reviews navigation
- Editable promotion banner: image, copy, CTA and service link
- Logo / Photograph / Graphic Design / Stock / PSD categories, search, dedicated product pages
- Logo order: company name, tagline, instructions
- Cart, Stripe checkout, Relay pending-payment workflow
- Order access keys, private downloads, license receipt, verified-purchase ratings and optional reviews
- Admin dashboard: products, banner, orders, custom delivery, review moderation, dispute-evidence export
- Mobile-responsive CSS, per-product SEO title/description/canonical, Product structured data for active products, sitemap and robots.txt
- Policy acceptance text/version/time and immutable purchased product/license snapshot

## যা এখনো আপনার account-এ connect করতে হবে

এই package account-এ deploy করা হয়নি এবং কোনো live payment নেওয়া হয়নি। Demo prices illustrative; কোনো demo product active নয়। কোনো fake review, fake sale বা unearned rating যোগ করা হয়নি। Photograph category-তে আপনার original photo বসানোর জায়গা আছে; কোনো অন্যের stock photo বিক্রির জন্য রাখা হয়নি।

Secrets, actual products/prices/files, Cloudflare resources, Stripe webhook এবং Relay request setup প্রয়োজন। Stripe test checkout দিয়ে যাচাই করার পরই live keys দিন। Automated email delivery এবং full email/password customer accounts এই version-এ নেই। My purchases order access-key ভিত্তিক; key নিজে save করা যায়, browser-এও থাকে। এটি login account নয়। Relay confirmation manual; screenshot/transaction claim দিয়ে auto-delivery হয় না।

## 1. GitHub + Cloudflare Pages frontend

1. নতুন GitHub repository তৈরি করুন: forge-haven-store। ZIP-এর ভেতরের project files upload করুন; ZIP ফাইলটি repository-তে দিয়ে কাজ হবে না।
2. Cloudflare → Workers & Pages → Pages → Connect to Git → repository নির্বাচন করুন।
3. Framework: None। Build command: `npm run build`। Output directory: `public`। Root directory: repository root।
4. Custom domain: `store.forgehavenllc.org` যোগ করুন। main website-এ Store link এই URL-এ দিন।
5. অন্য domain চাইলে build environment-এ `STORE_ORIGIN` সেট করুন; worker/wrangler.toml-এও একই origin বসান।

## 2. Backend: D1 + R2 + Worker

প্রথমবার terminal-এ project folder খুলে:

```bash
npx wrangler login
npx wrangler d1 create forge-haven-store
npx wrangler r2 bucket create forge-haven-private-files
```

D1 create-এর output-এর database_id কপি করে `worker/wrangler.toml`-এর placeholder replace করুন। R2 dashboard থেকে bucket তৈরি করলেও হবে। R2 billing enrollment চাইতে পারে; free allowance সীমিত, unlimited free নয়। Bucket public access OFF রাখুন। Product preview images public হতে পারে, paid originals private থাকবে।

```bash
npx wrangler d1 execute forge-haven-store --remote --config worker/wrangler.toml --file worker/schema.sql
node seed.mjs
npx wrangler d1 execute forge-haven-store --remote --config worker/wrangler.toml --file worker/seed.sql
```

একটি শক্তিশালী random admin token তৈরি করুন (কমপক্ষে ৩২ characters)। Node দিয়ে:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

এই token নিরাপদে রাখুন। GitHub/public JavaScript-এ দেবেন না। এরপর:

```bash
npx wrangler secret put ADMIN_TOKEN --config worker/wrangler.toml
npx wrangler secret put STRIPE_SECRET_KEY --config worker/wrangler.toml
npm run deploy:api
```

প্রতিটি prompt-এ সংশ্লিষ্ট secret paste করুন। Stripe-এ প্রথমে `sk_test_...` key ব্যবহার করুন। Deploy-এর Worker URL কপি করুন। `public/config.js`-এ:

```js
window.STORE_CONFIG = {
  apiBase: 'https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev',
  currency: 'USD',
  mainSite: 'https://forgehavenllc.org',
  supportEmail: 'support@forgehavenllc.org'
};
```

শেষে slash দেবেন না। GitHub commit করলে Pages update হবে।

## 3. Stripe connect

1. Stripe Dashboard → Developers / Workbench → Webhooks → Add destination।
2. URL: `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/stripe/webhook`
3. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`।
4. Signing secret (`whsec_...`) কপি করুন:

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET --config worker/wrangler.toml
```

5. নিজের test product দিয়ে test-mode checkout করুন। Paid webhook আসার আগে download unlock হওয়া উচিত নয়।
6. Test শেষ হলে live secret key ও live webhook secret আলাদাভাবে configure করুন। Stripe receipt emails চাইলে Stripe dashboard-এ enable করুন; store নিজে email পাঠায় না।

Stripe button hosted card checkout খুলবে। Price backend থেকে নির্ধারিত হয়; browser থেকে price বদলে কম payment নেওয়া যায় না। Payment confirmation শুধু signed webhook থেকে হয়। Secret key frontend-এ লাগে না। Refund actual Stripe dashboard-এ করতে হবে; admin-এর Revoke downloads refund পাঠায় না। Refund/dispute webhook access বন্ধ করে। Dispute জেতার guarantee নেই।

## 4. Relay connect — client choice

Relay option checkout-এ থাকে। Client এটি নিলে order Pending হবে এবং order ID পাবে।

1. Relay-তে সেই order-এর exact amount ও customer details দিয়ে Payment Request তৈরি করুন। আপনার account-এ available payment methods সেখানে দেখাবে।
2. Store admin → Orders → Attach Relay payment link-এ সেই নির্দিষ্ট order-এর HTTPS request link বসান।
3. Client My purchases → Open → Refresh status করলে Pay through Relay button পাবে। প্রয়োজনে আপনার business email দিয়ে customer-কে request পাঠান।
4. Client payment reference submit করতে পারবে। Reference submit মানেই paid নয়।
5. Relay dashboard-এ **টাকা received হয়েছে**, amount ও currency মিলেছে—যাচাই করে store admin → Confirm received funds। Bank transaction reference দিন। তারপর instant downloads খুলবে।

একই reusable payment-request link সব order-এ বসাবেন না, যদি সেটি amount/order-এর জন্য নির্দিষ্ট হয়। International clients-এর ACH নাও থাকতে পারে; Relay request-এ available method ব্যবহার করবে। Relay login password বা bank login credentials site-এ লাগবে না।

শুধু ACH/wire নিতে চাইলে `worker/wrangler.toml`-এর RELAY_INSTRUCTIONS-এ verified beneficiary name, bank name, account/routing বা wire instructions দিতে পারেন। Relay থেকে copied receiving instructions ব্যবহার করুন; বানানো routing/SWIFT ব্যবহার করবেন না। Instructions pending Relay order-এর authenticated view-এ দেখাবে।

Official references:
- https://relayfi.com/payment-requests/
- https://support.relayfi.com/hc/en-us/articles/11638266682004-Receiving-an-ACH
- https://docs.stripe.com/checkout/fulfillment
- https://developers.cloudflare.com/r2/pricing/

## 5. Products, custom delivery, banners

Admin: `https://store.forgehavenllc.org/admin.html`

1. ADMIN_TOKEN দিয়ে unlock করুন। Token শুধু page memory-তে থাকে।
2. Instant product-এর final ZIP/JPG/PSD Cloudflare R2 bucket-এ upload করুন। উদাহরণ private key: `products/poster-pack.zip`।
3. Public watermarked preview image `public/assets/`-এ রাখুন এবং GitHub push করুন। Preview URL হবে `https://store.forgehavenllc.org/assets/your-preview.jpg`। Preview watermark নিজে ছবিতে বসান; CSS overlay-কে protection হিসেবে ধরা হয়নি।
4. Product edit করুন: title, price (USD cents), description, format, exact license, preview URL, R2 key। Logo-তে custom delivery এবং delivery time/revision scope লিখুন।
5. Activate করুন যখন real files/details ready। Pending order-এর snapshot পরবর্তী product edits-এ বদলায় না।
6. **প্রতিবার product add/edit-এর পর Export catalog for SEO build চাপুন → downloaded catalog.json repository root-এ replace করুন → GitHub push।** Build product HTML + sitemap update করবে। নতুন product publish workflow এই export/build শেষ না হওয়া পর্যন্ত complete নয়।
7. Custom paid logo order ready হলে unique R2 key-তে final file upload করুন → Orders → Deliver → key দিন।

Banner-এ 50%/10% লিখলে নিজে থেকে price কমবে না। আগে actual product prices কমিয়ে তারপর discount advertise করুন। Default-এ কোনো fake discount দেওয়া হয়নি। Promotion banner-এর image optional; real poster URL দিলে image দেখাবে।

## 6. Reviews, evidence ও SEO

Only paid orders review দিতে পারে; rating required, review text optional। Admin publish করলে publicly দেখা যাবে। Negative review শুধু negative বলে মুছবেন না।

Orders → Export evidence-এ payment reference, original product/license snapshot, policy acceptance text/time/version এবং delivery/download-served events পাবেন। Server served a file মানে client সম্পূর্ণ download বা ব্যবহার করেছে তার প্রমাণ নয়। Manual Relay confirmation-এর evidence নিজে verify করতে হবে।

SEO-তে actual sellable product-এর নিজস্ব indexable HTML ও structured data থাকে। Demo product pages `noindex`, sitemap থেকে বাদ। Ratings না থাকলে fake AggregateRating markup নেই। Google Search Console-এ domain verify করে `https://store.forgehavenllc.org/sitemap.xml` submit করুন। Search ranking guarantee নয়। মূল .org site থেকে store link করুন। Original descriptions, licensed previews ও meaningful filenames দিন।

## Validation ও limitations

- `npm test`: signature validation, rejected forged/stale events, backend price enforcement, Relay pending/confirm/download/review flow, evidence privacy, unauthorized access, webhook replay after access revocation।
- Local tests use SQLite + mocked R2 and mocked Stripe session creation; no real bank/Stripe transaction was executed.
- Browser visual QA could not run in the build environment because the browser binary download failed. Check mobile + desktop before production.
- No inventory exclusivity: logo demo concepts may be purchased by multiple customers; licenses say non-exclusive. If selling exclusive logos, add reservation/sold-once logic first.
- Large file download is buffered in the browser before save; package very large videos in manageable sizes. Resumable multi-GB downloads are not implemented.
- Admin lists latest 200 orders/reviews. No auto email, password login, accounting system, tax calculation, coupon engine or automatic Relay reconciliation is included.
- Deployment/binding/merchant account testing remains required. Free tiers have limits; payment provider transaction fees may apply.

## Cloudflare Worker Build deployment (use this screen)

This package can now deploy the storefront and API together through the current Cloudflare Worker Build screen. It does not need a separate Pages project.

Before deploying, create one D1 database in Cloudflare named `forge-haven-store`. Copy its database ID, then edit `worker/wrangler.toml` in GitHub: replace `REPLACE_WITH_D1_DATABASE_ID` with that ID. Do not leave the placeholder.

In Cloudflare Worker Build:

- Project name: `forge-haven-store`
- Build command: `npm run build`
- Deploy command: `npm run deploy:api`
- Preview command: `npm run preview:worker`
- Advanced settings → Path: `sectors/forge-haven-store`

Deploy once after replacing the D1 ID. Use the Worker custom domain setting to add `store.forgehavenllc.org`. Static storefront files are served by the Worker, while `/api/*` handles the orders and payment backend.

Create the D1 schema and initial catalog after the first deploy from Cloudflare Workers → your Worker → Settings/Resources or through Wrangler using `worker/schema.sql` then `worker/seed.sql`. Payment secrets and R2 remain required before any live product payment or download is enabled.
