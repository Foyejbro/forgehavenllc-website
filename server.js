const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const multer = require("multer");
const Database = require("better-sqlite3");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const business = {
  name: process.env.BUSINESS_NAME || "Forge Haven LLC",
  email: process.env.BUSINESS_EMAIL || "admin@forgehavenllc.org",
  phone: process.env.BUSINESS_PHONE || "",
  address: process.env.BUSINESS_ADDRESS || "",
  website: process.env.BUSINESS_WEBSITE || "https://forgehavenllc.org"
};

const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(path.join(dataDir, "orders.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  client_type TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  service TEXT NOT NULL,
  service_date TEXT NOT NULL,
  details TEXT,
  total_amount REAL NOT NULL,
  advance_amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  trx_id TEXT,
  sender_number TEXT,
  sender_name TEXT,
  proof_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAYMENT_REVIEW',
  created_at TEXT NOT NULL,
  approved_at TEXT,
  invoice_no TEXT UNIQUE,
  invoice_path TEXT
);
`);

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-only-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000 * 60 * 60 * 8 }
}));
app.use(express.static(__dirname, { index: "index.html", extensions: ["html"] }));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  }
});
const allowed = new Set(["image/jpeg","image/png","image/webp","application/pdf"]);
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => allowed.has(file.mimetype) ? cb(null, true) : cb(new Error("Only JPG, PNG, WEBP or PDF allowed"))
});

function clean(v){ return String(v ?? "").trim(); }
function money(v){ return Number(v).toFixed(2); }
function newOrderNo(){
  const y = new Date().getFullYear();
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `FH-${y}-${suffix}`;
}
function newInvoiceNo(id){
  const y = new Date().getFullYear();
  return `FH-INV-${y}-${String(id).padStart(5,"0")}`;
}

function transporter(){
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if(!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: { user, pass }
  });
}

async function sendMail(opts){
  const t = transporter();
  if(!t){
    console.log("[EMAIL SKIPPED - SMTP not configured]", opts.subject, opts.to);
    return { skipped: true };
  }
  return t.sendMail({
    from: process.env.SMTP_FROM || `${business.name} <${business.email}>`,
    ...opts
  });
}

function requireAdmin(req,res,next){
  if(req.session && req.session.admin) return next();
  return res.status(401).json({ error:"Unauthorized" });
}

function generateInvoice(order){
  const invoiceNo = order.invoice_no || newInvoiceNo(order.id);
  const fileName = `${invoiceNo}.pdf`;
  const fullPath = path.join(uploadDir, fileName);
  const doc = new PDFDocument({ margin: 46, size: "A4" });
  doc.pipe(fs.createWriteStream(fullPath));

  doc.fontSize(24).text(business.name, { align:"left" });
  doc.moveDown(.2).fontSize(10).fillColor("#555")
    .text([business.address,business.email,business.phone,business.website].filter(Boolean).join(" • "));
  doc.moveDown(1.2).fillColor("#111").fontSize(20).text("INVOICE", { align:"right" });
  doc.fontSize(10).fillColor("#555").text(`Invoice No: ${invoiceNo}`, { align:"right" });
  doc.text(`Issue Date: ${new Date().toISOString().slice(0,10)}`, { align:"right" });
  doc.text(`Order No: ${order.order_no}`, { align:"right" });

  doc.moveDown(2).fillColor("#111").fontSize(12).text("Bill To", { underline:true });
  doc.fontSize(11).text(order.client_name);
  doc.fillColor("#555").text(order.client_email);

  doc.moveDown(1.5).fillColor("#111").fontSize(12).text("Service Details", { underline:true });
  doc.fontSize(10).fillColor("#444");
  doc.text(`Service: ${order.service}`);
  doc.text(`Service / Project Date: ${order.service_date}`);
  if(order.details) doc.text(`Description: ${order.details}`);

  doc.moveDown(1.5);
  const x1=46, x2=330, x3=455;
  doc.fillColor("#111").fontSize(10).text("Description",x1,doc.y);
  doc.text("Amount (BDT)",x2,doc.y-12);
  doc.text("Status",x3,doc.y-12);
  doc.moveDown(.5);
  doc.moveTo(46,doc.y).lineTo(550,doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(.6);
  const rowY=doc.y;
  doc.text(order.service,x1,rowY,{width:260});
  doc.text(money(order.advance_amount),x2,rowY);
  doc.text("PAID / APPROVED",x3,rowY,{width:95});
  doc.moveDown(2.2);

  doc.fillColor("#111").fontSize(12).text(`Advance Paid: BDT ${money(order.advance_amount)}`, { align:"right" });
  doc.fontSize(10).fillColor("#555").text(`Project Total: BDT ${money(order.total_amount)}`, { align:"right" });
  doc.text(`Remaining Balance: BDT ${money(Number(order.total_amount)-Number(order.advance_amount))}`, { align:"right" });

  doc.moveDown(2).fillColor("#111").fontSize(11).text("Payment Information", { underline:true });
  doc.fontSize(9).fillColor("#555")
    .text(`Method: ${order.payment_method}`)
    .text(`Transaction / Reference: ${order.trx_id || "N/A"}`)
    .text(`Sender Name: ${order.sender_name || "N/A"}`)
    .text(`Sender Number: ${order.sender_number || "N/A"}`);

  doc.moveDown(1.5).fillColor("#111").fontSize(10).text("Advance & Refund Policy", { underline:true });
  doc.fontSize(8.8).fillColor("#555").text(
    "Advance payment confirms the project. Refund eligibility depends on project status and work already completed. " +
    "If work has not started, an eligible advance refund may be processed according to the agreed service terms. " +
    "Once work has started, completed work, third-party costs, platform fees, paid media spend, and other non-recoverable costs may be deducted before any eligible refund."
  );

  doc.moveDown(1.5).fontSize(8).fillColor("#777")
    .text("This invoice records an actual order and approval. Service/Project Date is shown separately from the invoice issue date.");

  doc.end();
  return { invoiceNo, fullPath, fileName };
}

app.post("/api/orders", upload.single("proof"), async (req,res) => {
  try{
    const b = req.body;
    const required = ["clientType","clientName","clientEmail","service","serviceDate","totalAmount","advanceAmount","paymentMethod"];
    for(const k of required){
      if(!clean(b[k])) return res.status(400).json({error:`Missing ${k}`});
    }
    if(!req.file) return res.status(400).json({error:"Payment proof is required"});
    const total = Number(b.totalAmount), advance = Number(b.advanceAmount);
    if(!Number.isFinite(total) || !Number.isFinite(advance) || total < 0 || advance < 0 || advance > total){
      return res.status(400).json({error:"Invalid payment amount"});
    }
    if(["bKash","Nagad"].includes(b.paymentMethod) && (!clean(b.senderNumber) || !clean(b.senderName))){
      return res.status(400).json({error:"Sender number and sender name are required for bKash/Nagad"});
    }

    const orderNo = newOrderNo();
    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO orders(order_no,client_type,client_name,client_email,service,service_date,details,total_amount,advance_amount,payment_method,trx_id,sender_number,sender_name,proof_path,status,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    stmt.run(orderNo, clean(b.clientType), clean(b.clientName), clean(b.clientEmail), clean(b.service), clean(b.serviceDate),
      clean(b.details), total, advance, clean(b.paymentMethod), clean(b.trxId), clean(b.senderNumber), clean(b.senderName),
      `/uploads/${req.file.filename}`, "PAYMENT_REVIEW", createdAt);

    const adminTo = process.env.ORDER_NOTIFICATION_EMAIL || business.email;
    await sendMail({
      to: adminTo,
      subject: `New Order ${orderNo} — ${clean(b.clientName)}`,
      html: `<h2>New order received</h2>
      <p><b>Order:</b> ${orderNo}</p><p><b>Client:</b> ${clean(b.clientName)} (${clean(b.clientEmail)})</p>
      <p><b>Service:</b> ${clean(b.service)}</p><p><b>Advance:</b> BDT ${money(advance)}</p>
      <p><b>Payment:</b> ${clean(b.paymentMethod)} | ${clean(b.trxId) || "No reference"}</p>
      <p>Review in admin: <a href="${BASE_URL}/admin.html">${BASE_URL}/admin.html</a></p>`
    });

    res.json({ ok:true, orderNo, status:"PAYMENT_REVIEW" });
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message || "Server error"});
  }
});

app.post("/api/admin/login",(req,res)=>{
  const email=clean(req.body.email), password=String(req.body.password||"");
  if(email === (process.env.ADMIN_EMAIL || "admin@forgehavenllc.org") &&
     password === (process.env.ADMIN_PASSWORD || "change-this-password")){
    req.session.admin = { email };
    return res.json({ok:true});
  }
  return res.status(401).json({error:"Invalid login"});
});

app.post("/api/admin/logout",requireAdmin,(req,res)=>{
  req.session.destroy(()=>res.json({ok:true}));
});

app.get("/api/admin/me",(req,res)=>{
  res.json({authenticated:!!(req.session&&req.session.admin), email:req.session?.admin?.email||null});
});

app.get("/api/admin/orders",requireAdmin,(req,res)=>{
  const rows=db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  res.json(rows);
});

app.post("/api/admin/orders/:id/approve",requireAdmin, async (req,res)=>{
  try{
    const id=Number(req.params.id);
    let order=db.prepare("SELECT * FROM orders WHERE id=?").get(id);
    if(!order) return res.status(404).json({error:"Order not found"});
    if(order.status==="APPROVED" && order.invoice_path){
      return res.json({ok:true, alreadyApproved:true, order});
    }

    const invoice = generateInvoice(order);
    const approvedAt = new Date().toISOString();
    db.prepare("UPDATE orders SET status='APPROVED',approved_at=?,invoice_no=?,invoice_path=? WHERE id=?")
      .run(approvedAt,invoice.invoiceNo,`/uploads/${invoice.fileName}`,id);
    order=db.prepare("SELECT * FROM orders WHERE id=?").get(id);

    await sendMail({
      to: order.client_email,
      subject: `Invoice ${invoice.invoiceNo} — ${business.name}`,
      html:`<p>Hello ${order.client_name},</p>
      <p>Your payment has been verified and your order <b>${order.order_no}</b> is approved.</p>
      <p>Your invoice is attached.</p>
      <p>Thank you,<br>${business.name}</p>`,
      attachments:[{filename:invoice.fileName,path:invoice.fullPath}]
    });

    await sendMail({
      to: process.env.ORDER_NOTIFICATION_EMAIL || business.email,
      subject:`Approved ${order.order_no} — Invoice ${invoice.invoiceNo}`,
      html:`<p>Order ${order.order_no} has been approved.</p><p>Invoice: ${invoice.invoiceNo}</p>`,
      attachments:[{filename:invoice.fileName,path:invoice.fullPath}]
    });

    res.json({ok:true,order});
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message||"Approval failed"});
  }
});

app.get("/api/order/:orderNo",(req,res)=>{
  const o=db.prepare("SELECT order_no,client_name,service,service_date,total_amount,advance_amount,payment_method,status,created_at,invoice_no,invoice_path FROM orders WHERE order_no=?")
    .get(clean(req.params.orderNo));
  if(!o) return res.status(404).json({error:"Not found"});
  res.json(o);
});

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(400).json({error:err.message||"Request failed"});
});

app.listen(PORT,()=>console.log(`Forge Haven Order System running at ${BASE_URL}`));
