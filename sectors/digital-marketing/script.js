const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];


/* =====================================================
   MOBILE MENU
===================================================== */

const menu = $(".menu-toggle");
const links = $(".nav-links");

if (menu && links) {
  menu.addEventListener("click", () => {
    links.classList.toggle("open");
  });
}


/* =====================================================
   NAV DROPDOWN
===================================================== */

$$(".nav-drop > button").forEach(button => {

  button.addEventListener("click", () => {
    button.parentElement.classList.toggle("open");
  });

});


/* =====================================================
   SCROLL REVEAL
===================================================== */

const io = new IntersectionObserver(
  entries => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {
        entry.target.classList.add("in");
      }

    });

  },
  {
    threshold: 0.12
  }
);

$$(".reveal").forEach(element => {
  io.observe(element);
});


/* =====================================================
   FAQ
===================================================== */

$$(".faq-q").forEach(question => {

  question.addEventListener("click", () => {
    question.parentElement.classList.toggle("open");
  });

});


/* =====================================================
   BLOG FILTER
===================================================== */

$$(".filter-btn").forEach(button => {

  button.addEventListener("click", () => {

    $$(".filter-btn").forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    const filter = button.dataset.filter;

    $$(".blog-card").forEach(card => {

      card.style.display =
        filter === "all" ||
        card.dataset.cat === filter
          ? "block"
          : "none";

    });

  });

});


/* =====================================================
   CONTACT FORM → WHATSAPP
===================================================== */

const contactForm = $("#contactForm");

if (contactForm) {

  contactForm.addEventListener("submit", event => {

    event.preventDefault();

    const form = new FormData(contactForm);

    const message =
      `Hi Forge Digital, I have an inquiry.%0A%0A` +
      `Name: ${encodeURIComponent(form.get("name") || "")}%0A` +
      `Email: ${encodeURIComponent(form.get("email") || "")}%0A` +
      `Phone: ${encodeURIComponent(form.get("phone") || "")}%0A` +
      `Subject: ${encodeURIComponent(form.get("subject") || "")}%0A` +
      `Message: ${encodeURIComponent(form.get("message") || "")}`;

    window.open(
      `https://wa.me/8801639444747?text=${message}`,
      "_blank"
    );

  });

}


/* =====================================================
   NEWSLETTER
===================================================== */

const newsletterForm = $("#newsletterForm");

if (newsletterForm) {

  newsletterForm.addEventListener("submit", event => {

    event.preventDefault();

    const input = $("input", newsletterForm);

    if (!input) return;

    const value = input.value.trim();

    if (value) {

      window.location.href =
        `mailto:help@forgehavenllc.org` +
        `?subject=Forge%20Digital%20Updates` +
        `&body=Please%20add%20${encodeURIComponent(value)}` +
        `%20to%20the%20updates%20list.`;

    }

  });

}


/* =====================================================
   DYNAMIC YEAR
===================================================== */

$$("[data-year]").forEach(element => {
  element.textContent = new Date().getFullYear();
});


/* =====================================================
   TEAM PROFILE MODAL
===================================================== */

const profileModal =
  document.getElementById("profileModal");

const profileModalContent =
  document.getElementById("profileModalContent");


/* =====================================================
   TEAM PROFILE DATA
===================================================== */

const profileData = {


  /* -------------------------------------------------
     MD FARHAD HOSSAIN
  ------------------------------------------------- */

  farhad: {

    name: "Md Farhad Hossain",

    role: "Digital Marketing Specialist",

    image:
      "../../images/Forhadmarketinglead1.jpg",

    education: "",

    training: "",

    bio: `
      Md Farhad Hossain is a results-driven Digital Marketing
      Specialist focused on helping businesses strengthen their
      digital presence and reach relevant audiences through
      structured online marketing strategies.

      His areas of work include search engine optimization,
      social media marketing, paid advertising, content strategy,
      audience targeting, campaign optimization and digital
      performance analysis.

      Through practical training, real-world projects and
      hands-on experience with modern marketing platforms, he
      focuses on building data-informed strategies designed to
      improve brand visibility, customer engagement, lead
      generation and sustainable business growth.
    `,

    skills: [

      "Search Engine Optimization (SEO)",

      "Social Media Marketing",

      "Facebook & Instagram Marketing",

      "Google Ads & Paid Campaigns",

      "Content Marketing",

      "Audience Research",

      "Competitor Research",

      "Digital Marketing Strategy",

      "Campaign Performance Analysis",

      "Lead Generation",

      "Conversion Optimization"

    ]

  },


  /* -------------------------------------------------
     MD SOJIB HOSSEN
  ------------------------------------------------- */

  sojib: {

    name: "Md Sojib Hossen",

    role:
      "SEO & Search Strategy Specialist",

    image:
      "../../images/sojibhossenlead1.jpg",

    education: "",

    training: "",

    bio: `
      Md Sojib Hossen is an SEO & Search Strategy Specialist
      focused on improving website visibility, organic search
      performance and sustainable online growth.

      He specializes in developing search-focused strategies
      designed to help businesses connect with relevant audiences
      through organic search.

      His areas of focus include keyword research, on-page SEO,
      technical SEO, content optimization, competitor analysis,
      local SEO and search performance monitoring.

      With a data-driven and growth-focused approach, Sojib works
      to build search strategies that improve organic visibility,
      attract relevant visitors and support long-term business
      growth.
    `,

    skills: [

      "Keyword Research",

      "Search Intent Analysis",

      "On-Page SEO",

      "Technical SEO",

      "SEO Content Optimization",

      "Competitor & SERP Analysis",

      "Local SEO",

      "Website SEO Audits",

      "Organic Search Strategy",

      "Search Performance Analysis",

      "SEO Growth Planning"

    ]

  },


  /* -------------------------------------------------
     MORIOM AKTER SWEETY
  ------------------------------------------------- */

  sweety: {

    name: "Moriom Akter Sweety",

    role:
      "Digital Marketing Executive",

    image:
      "../../images/moriom-sweety.jpg",

    education:
      "Honours 1st Year (2026–Present) · University of Liberal Arts Bangladesh (ULAB) · ESS Department",

    training:
      "Professional Digital Marketing Training · Creative IT Institute",

    bio: `
      Moriom Akter Sweety is a Digital Marketing Executive at
      Forge Digital, the Digital Marketing Division of Forge
      Haven LLC.

      She works across social media marketing, content planning,
      campaign coordination, audience research, digital
      communication and day-to-day marketing execution.

      Alongside her professional work, she is currently pursuing
      her Honours studies at the University of Liberal Arts
      Bangladesh (ULAB) in the ESS Department and has completed
      professional Digital Marketing training from Creative IT
      Institute.

      Her work focuses on understanding target audiences,
      supporting brand communication, maintaining consistent
      social media activity, researching market opportunities
      and helping execute digital campaigns across relevant
      platforms.

      With a combination of academic learning, professional
      training and practical marketing experience, she continues
      to develop her capabilities in modern digital marketing,
      campaign execution and online brand growth.
    `,

    skills: [

      "Digital Marketing",

      "Social Media Marketing",

      "Facebook Marketing",

      "Instagram Marketing",

      "Content Planning",

      "Content Coordination",

      "Audience Research",

      "Competitor Research",

      "Campaign Coordination",

      "Digital Campaign Support",

      "Lead Generation Support",

      "Social Media Management",

      "Basic SEO",

      "Keyword Research",

      "Market Research",

      "Brand Communication",

      "Customer Engagement",

      "Marketing Performance Monitoring"

    ]

  }

};


/* =====================================================
   OPEN PROFILE
===================================================== */

function openProfile(profileKey) {

  if (
    !profileModal ||
    !profileModalContent
  ) {
    return;
  }

  const profile =
    profileData[profileKey];

  if (!profile) {
    return;
  }


  const educationHTML =
    profile.education
      ? `
        <div class="profile-detail-block">

          <span class="profile-detail-label">
            Education
          </span>

          <p>
            ${profile.education}
          </p>

        </div>
      `
      : "";


  const trainingHTML =
    profile.training
      ? `
        <div class="profile-detail-block">

          <span class="profile-detail-label">
            Professional Training
          </span>

          <p>
            ${profile.training}
          </p>

        </div>
      `
      : "";


  profileModalContent.innerHTML = `

    <div class="profile-popup-grid">


      <div class="profile-popup-image">

        <img
          src="${profile.image}"
          alt="${profile.name}"
          loading="eager"
        >

      </div>


      <div class="profile-popup-copy">

        <span class="kicker">
          Forge Digital · Team Profile
        </span>


        <h2>
          ${profile.name}
        </h2>


        <div class="profile-popup-role">
          ${profile.role}
        </div>


        ${
          educationHTML || trainingHTML
            ? `
              <div class="profile-meta">

                ${educationHTML}

                ${trainingHTML}

              </div>
            `
            : ""
        }


        <div class="profile-bio">

          ${profile.bio
            .trim()
            .split(/\n\s*\n/)
            .map(
              paragraph =>
                `<p>${paragraph.trim()}</p>`
            )
            .join("")}

        </div>


        <h4>
          Areas of Expertise
        </h4>


        <div class="profile-skills">

          ${profile.skills
            .map(
              skill =>
                `<span>${skill}</span>`
            )
            .join("")}

        </div>


        <div class="profile-popup-footer">

          <a
            href="contact.html"
            class="btn"
          >
            Work With Our Team
            <span>↗</span>
          </a>

        </div>


      </div>

    </div>

  `;


  profileModal.classList.add("active");

  profileModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

}


/* =====================================================
   CLOSE PROFILE
===================================================== */

function closeProfile() {

  if (!profileModal) {
    return;
  }

  profileModal.classList.remove(
    "active"
  );

  profileModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );

}


/* =====================================================
   TEAM CARD CLICK
===================================================== */

document
  .querySelectorAll(".profile-trigger")
  .forEach(card => {

    card.addEventListener(
      "click",
      () => {

        openProfile(
          card.dataset.profile
        );

      }
    );


    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          openProfile(
            card.dataset.profile
          );

        }

      }
    );

  });


/* =====================================================
   PROFILE CLOSE BUTTON / BACKDROP
===================================================== */

document
  .querySelectorAll(
    "[data-close-profile]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      closeProfile
    );

  });


/* =====================================================
   ESC CLOSE PROFILE
===================================================== */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      profileModal?.classList.contains(
        "active"
      )
    ) {

      closeProfile();

    }

  }
);


/* =====================================================
   FACEBOOK MARKETING SHOWCASE ANIMATION
===================================================== */

(() => {

  const section =
    document.querySelector(
      ".dm-showcase"
    );

  if (!section) {
    return;
  }


  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  if (reduceMotion) {

    section.classList.add(
      "is-active"
    );

    return;

  }


  const observer =
    new IntersectionObserver(

      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              section.classList.add(
                "is-active"
              );

              observer.unobserve(
                section
              );

            }

          }
        );

      },

      {
        threshold: 0.20
      }

    );


  observer.observe(section);

})();
