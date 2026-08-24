const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* =========================================================
   SMOOTH SCROLL — LENIS
========================================================= */

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let lenis = null;

if (typeof Lenis !== "undefined" && !reduceMotion) {

  lenis = new Lenis({
    duration: 0.72,
    easing: t => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    wheelMultiplier: 1.16,
    touchMultiplier: 1.05
  });

  function lenisRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
  }

  requestAnimationFrame(lenisRaf);


  /* Smooth anchor links */

  $$('a[href^="#"]').forEach(a => {

    a.addEventListener("click", e => {

      const id = a.getAttribute("href");

      if (
        id &&
        id.length > 1 &&
        $(id)
      ) {

        e.preventDefault();

        lenis.scrollTo(id, {
          offset: -90,
          duration: 0.8
        });

      }

    });

  });

}


/* =========================================================
   MOBILE MENU
========================================================= */

const menu = $("#menuBtn");
const nav = $("#navMenu");

if (menu && nav) {

  menu.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

}

$$("#navMenu a").forEach(a => {

  a.addEventListener("click", () => {

    if (nav) {
      nav.classList.remove("open");
    }

  });

});


/* =========================================================
   REVEAL ANIMATION
========================================================= */

const revealObserver = new IntersectionObserver(
  entries => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        entry.target.classList.add("in");

        revealObserver.unobserve(entry.target);

      }

    });

  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px"
  }
);


$$(".reveal").forEach(el => {

  const parent = el.parentElement;

  if (parent) {

    const siblings = [...parent.children].filter(
      c =>
        c.classList &&
        c.classList.contains("reveal")
    );

    const idx = siblings.indexOf(el);

    if (idx > 0) {

      el.style.transitionDelay =
        Math.min(idx * 90, 360) + "ms";

    }

  }

  revealObserver.observe(el);

});


/* =========================================================
   PAGE SCROLL PROGRESS
========================================================= */

const progress = $("#progress");

function updateProgress() {

  if (!progress) return;

  const max =
    document.documentElement.scrollHeight -
    window.innerHeight;

  const value =
    max > 0
      ? (window.scrollY / max) * 100
      : 0;

  progress.style.width = value + "%";

}

addEventListener(
  "scroll",
  updateProgress,
  { passive: true }
);

updateProgress();


/* =========================================================
   GRAPHIC DESIGN SERVICES
========================================================= */

const services = [

  {
    title: "Brand Identity",

    intro:
      "A visual foundation that makes a business feel consistent across real customer touchpoints.",

    word: "IDENTITY",

    sub:
      "SYSTEM / CLARITY / RECOGNITION",

    items: [
      "Logo direction or logo refinement",
      "Color and typography system",
      "Stationery / corporate applications",
      "Social profile brand assets",
      "Practical identity guidance"
    ]
  },


  {
    title: "Marketing Design",

    intro:
      "Campaign and promotional graphics built around clear hierarchy, message and commercial context.",

    word: "CAMPAIGN",

    sub:
      "MESSAGE / OFFER / VISIBILITY",

    items: [
      "Campaign key visuals",
      "Posters and banners",
      "Promotional graphics",
      "Product marketing materials",
      "Sales / launch creative"
    ]
  },


  {
    title: "Social & Ad Creative",

    intro:
      "Platform-aware visuals designed for fast viewing, content consistency and paid campaign variation.",

    word: "SOCIAL",

    sub:
      "CONTENT / ADS / VARIANTS",

    items: [
      "Facebook and Instagram posts",
      "Stories and covers",
      "Paid-ad creative variants",
      "Thumbnails",
      "Reusable content templates"
    ]
  },


  {
    title: "Photo Manipulation",

    intro:
      "Advanced image production for commercial artwork, campaigns, products and visual storytelling.",

    word: "IMAGE",

    sub:
      "RETOUCH / COMPOSITE / FX",

    items: [
      "High-end retouching",
      "Creative compositing",
      "Background replacement",
      "Image restoration",
      "Product and commercial graphics"
    ]
  },


  {
    title: "Print & Corporate",

    intro:
      "Professional layouts prepared for business communication and real print production.",

    word: "PRINT",

    sub:
      "LAYOUT / CORPORATE / PRODUCTION",

    items: [
      "Brochures and flyers",
      "Corporate presentations",
      "Business stationery",
      "Posters",
      "Print-ready files"
    ]
  },


  {
    title: "Redesign & Recreation",

    intro:
      "Existing visuals can be cleaned up, modernized, adapted or rebuilt into a stronger direction.",

    word: "REDESIGN",

    sub:
      "IMPROVE / ADAPT / MODERNIZE",

    items: [
      "Existing design improvement",
      "Reference-led new direction",
      "Design cleanup",
      "New size adaptations",
      "Modernization of old artwork"
    ]
  }

];


/* =========================================================
   SERVICE POSTER IMAGES
========================================================= */

const posterImages = [

  "assets/creative-eye.png",
  "assets/digital-face.png",
  "assets/creative-eye.png",
  "assets/digital-face.png",
  "assets/creative-eye.png",
  "assets/digital-face.png"

];


/* =========================================================
   SERVICE CHANGE
========================================================= */

function setService(i) {

  const s = services[i];

  if (!s) return;


  const serviceTitle = $("#serviceTitle");
  const serviceIntro = $("#serviceIntro");
  const posterWord = $("#posterWord");
  const posterSub = $("#posterSub");
  const deliverables = $("#serviceDeliverables");
  const counter = $("#serviceCounter");
  const serviceNo = $(".service-no");


  if (serviceTitle) {
    serviceTitle.textContent = s.title;
  }


  if (serviceIntro) {
    serviceIntro.textContent = s.intro;
  }


  if (posterWord) {
    posterWord.textContent = s.word;
  }


  if (posterSub) {
    posterSub.textContent = s.sub;
  }


  if (deliverables) {

    deliverables.innerHTML =
      s.items
        .map(item => `<li>${item}</li>`)
        .join("");

  }


  if (counter) {

    counter.textContent =
      String(i + 1).padStart(2, "0") +
      " / 06";

  }


  if (serviceNo) {

    serviceNo.textContent =
      String(i + 1).padStart(2, "0");

  }


  $$(".service-tabs button").forEach(
    (button, j) => {

      button.classList.toggle(
        "active",
        i === j
      );

    }
  );


  /* Poster Image Change */

  const posterImg = $("#posterImg");

  if (posterImg) {

    posterImg.style.opacity = "0";

    setTimeout(() => {

      posterImg.src =
        posterImages[i];

      posterImg.style.opacity = ".5";

    }, 220);

  }


  /* Poster Animation */

  const poster = $("#servicePoster");

  if (poster) {

    poster.animate(
      [
        {
          opacity: 0.35,
          transform:
            "perspective(1000px) rotateY(-10deg) scale(.98)"
        },

        {
          opacity: 1,
          transform:
            "perspective(1000px) rotateY(-6deg) scale(1)"
        }
      ],
      {
        duration: 520,
        easing:
          "cubic-bezier(.2,.8,.2,1)"
      }
    );

  }

}


/* =========================================================
   SERVICE BUTTONS
========================================================= */

$$(".service-tabs button").forEach(
  (button, i) => {

    button.addEventListener(
      "click",
      () => setService(i)
    );

  }
);


/* =========================================================
   SERVICE JUMP BUTTONS
========================================================= */

$$("[data-service-jump]").forEach(button => {

  button.addEventListener("click", () => {

    const i =
      Number(
        button.dataset.serviceJump
      );

    setService(i);


    const servicesSection =
      $("#services");


    if (!servicesSection) return;


    if (lenis) {

      lenis.scrollTo(
        servicesSection,
        {
          offset: -90,
          duration: 0.8
        }
      );

    } else {

      servicesSection.scrollIntoView({
        behavior: "smooth"
      });

    }

  });

});


/* =========================================================
   PARTICLE / NETWORK CANVAS
========================================================= */

function particleCanvas(
  id,
  count,
  network = false
) {

  const canvas =
    document.getElementById(id);

  if (!canvas) return;


  const ctx =
    canvas.getContext("2d");

  let points = [];


  function resize() {

    const d =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );

    const rect =
      canvas.getBoundingClientRect();


    canvas.width =
      rect.width * d;

    canvas.height =
      rect.height * d;


    ctx.setTransform(
      d,
      0,
      0,
      d,
      0,
      0
    );


    points =
      Array.from(
        { length: count },
        () => ({
          x:
            Math.random() *
            rect.width,

          y:
            Math.random() *
            rect.height,

          vx:
            (Math.random() - 0.5) *
            0.12,

          vy:
            (Math.random() - 0.5) *
            0.12,

          r:
            Math.random() *
            1.15 +
            0.2
        })
      );

  }


  function frame() {

    const width =
      canvas.clientWidth;

    const height =
      canvas.clientHeight;


    ctx.clearRect(
      0,
      0,
      width,
      height
    );


    points.forEach(p => {

      p.x += p.vx;
      p.y += p.vy;


      if (
        p.x < 0 ||
        p.x > width
      ) {

        p.vx *= -1;

      }


      if (
        p.y < 0 ||
        p.y > height
      ) {

        p.vy *= -1;

      }


      ctx.fillStyle =
        "rgba(255,255,255,.18)";


      ctx.beginPath();

      ctx.arc(
        p.x,
        p.y,
        p.r,
        0,
        Math.PI * 2
      );

      ctx.fill();

    });


    if (network) {

      ctx.strokeStyle =
        "rgba(255,255,255,.035)";


      for (
        let i = 0;
        i < points.length;
        i += 5
      ) {

        for (
          let j = i + 5;
          j < points.length;
          j += 13
        ) {

          const a =
            points[i];

          const b =
            points[j];


          if (!a || !b) continue;


          const dx =
            a.x - b.x;

          const dy =
            a.y - b.y;


          if (
            dx * dx +
            dy * dy <
            14000
          ) {

            ctx.beginPath();

            ctx.moveTo(
              a.x,
              a.y
            );

            ctx.lineTo(
              b.x,
              b.y
            );

            ctx.stroke();

          }

        }

      }

    }


    requestAnimationFrame(frame);

  }


  resize();

  addEventListener(
    "resize",
    resize
  );

  frame();

}


/* =========================================================
   PARTICLE EFFECTS
========================================================= */

/*
   Hero particles intentionally reduced
   for cleaner dark background.
*/

particleCanvas(
  "heroParticles",
  90,
  false
);


particleCanvas(
  "network",
  95,
  true
);


/* =========================================================
   HERO MOUSE PARALLAX
========================================================= */

const hv =
  $("#heroVisual");

const cards =
  hv
    ? $$(".art-card", hv)
    : [];


if (
  hv &&
  matchMedia("(pointer:fine)").matches &&
  !reduceMotion
) {

  hv.addEventListener(
    "mousemove",
    e => {

      const r =
        hv.getBoundingClientRect();


      const nx =
        (e.clientX - r.left) /
        r.width -
        0.5;


      const ny =
        (e.clientY - r.top) /
        r.height -
        0.5;


      cards.forEach(card => {

        const depth =
          Number(
            card.dataset.depth || 20
          );


        const baseRotation =
          card.classList.contains("art-a")
            ? 4
            : -5;


        card.style.transform =
          `translate3d(
            ${nx * depth}px,
            ${ny * depth}px,
            0
          )
          rotate(${baseRotation}deg)`;

      });

    }
  );


  hv.addEventListener(
    "mouseleave",
    () => {

      cards.forEach(card => {

        card.style.transform = "";

      });

    }
  );

}


/* =========================================================
   PROJECT FORM
========================================================= */

const form =
  $("#projectForm");


if (form) {

  form.addEventListener(
    "submit",
    e => {

      e.preventDefault();


      if (
        !form.reportValidity()
      ) return;


      const f =
        new FormData(form);


      const msg =
`Hi Forge Creative,

I would like to discuss a graphic design project.

Name:
${f.get("name")}

Company / Brand:
${f.get("company") || "-"}

Country / City:
${f.get("country")}

Project type:
${f.get("type")}

Project summary:
${f.get("summary")}

Deadline:
${f.get("deadline") || "Flexible"}

Budget range:
${f.get("budget") || "To discuss"}

Reference / asset link:
${f.get("reference") || "-"}

Preferred contact:
${f.get("method")}

Contact detail:
${f.get("contact")}`;


      const url =
        "https://wa.me/8801639444747?text=" +
        encodeURIComponent(msg);


      window.open(
        url,
        "_blank",
        "noopener"
      );

    }
  );

}


/* =========================================================
   INITIAL SERVICE
========================================================= */

setService(0);
