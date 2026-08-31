
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const menu=$('.menu-toggle'), links=$('.nav-links'); if(menu) menu.addEventListener('click',()=>links.classList.toggle('open'));
$$('.nav-drop>button').forEach(b=>b.addEventListener('click',()=>b.parentElement.classList.toggle('open')));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.12}); $$('.reveal').forEach(el=>io.observe(el));
$$('.faq-q').forEach(q=>q.addEventListener('click',()=>q.parentElement.classList.toggle('open')));
$$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;$$('.blog-card').forEach(c=>c.style.display=(f==='all'||c.dataset.cat===f)?'block':'none')}));
const cf=$('#contactForm'); if(cf) cf.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(cf);const msg=`Hi Forge Digital, I have an inquiry.%0A%0AName: ${encodeURIComponent(f.get('name')||'')}%0AEmail: ${encodeURIComponent(f.get('email')||'')}%0APhone: ${encodeURIComponent(f.get('phone')||'')}%0ASubject: ${encodeURIComponent(f.get('subject')||'')}%0AMessage: ${encodeURIComponent(f.get('message')||'')}`;window.open(`https://wa.me/8801639444747?text=${msg}`,'_blank')});
const nf=$('#newsletterForm'); if(nf) nf.addEventListener('submit',e=>{e.preventDefault();const v=$('input',nf).value.trim(); if(v){window.location.href=`mailto:help@forgehavenllc.org?subject=Forge%20Digital%20Updates&body=Please%20add%20${encodeURIComponent(v)}%20to%20the%20updates%20list.`}});
$$('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
const profileModal = document.getElementById("profileModal");
const profileModalContent = document.getElementById("profileModalContent");

const profileData = {

  farhad: {
    name: "Md Farhad Hossain",
    role: "Digital Marketing Specialist",
    image: "../../images/Forhadmarketinglead1.jpg",

    bio: `
      Md Farhad Hossain is a results-driven Digital Marketing Specialist
      focused on helping businesses grow their online presence through
      effective digital marketing strategies. His areas of expertise
      include SEO, social media marketing, paid advertising, content
      strategy, audience targeting, and digital campaign optimization.

      He is continuously developing his skills through practical training,
      real-world projects, and hands-on experience with modern digital
      marketing tools and platforms. His goal is to create data-driven
      marketing strategies that improve brand visibility, customer
      engagement, and business growth.
    `,

    skills: [
      "Search Engine Optimization (SEO)",
      "Social Media Marketing",
      "Facebook & Instagram Marketing",
      "Google Ads & Paid Campaigns",
      "Content Marketing",
      "Audience & Competitor Research",
      "Digital Marketing Strategy",
      "Campaign Performance Analysis",
      "Lead Generation",
      "Conversion Optimization"
    ]
  },


  sojib: {
    name: "Md Sojib Hossen",
    role: "SEO & Search Strategy Specialist",
    image: "../../images/sojibhossenlead1.jpg",

    bio: `
      Md Sojib Hossen is an SEO & Search Strategy Specialist focused on
      improving website visibility, organic search performance, and
      sustainable online growth. He specializes in developing
      search-focused strategies that help businesses reach the right
      audience through organic search.

      His areas of focus include keyword research, on-page SEO,
      technical SEO, content optimization, competitor analysis,
      local SEO, and search performance monitoring. With a data-driven
      and growth-focused approach, Sojib aims to build effective search
      strategies that improve organic visibility, attract relevant
      visitors, and support long-term business growth.
    `,

    skills: [
      "Keyword Research & Search Intent",
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
  }

};


function openProfile(profileKey) {

  if (!profileModal || !profileModalContent) return;

  const profile = profileData[profileKey];

  if (!profile) return;

  profileModalContent.innerHTML = `
    <div class="profile-popup-grid">

      <img
        src="${profile.image}"
        alt="${profile.name}"
      >

      <div class="profile-popup-copy">

        <span class="kicker">
          Team Profile
        </span>

        <h2>
          ${profile.name}
        </h2>

        <div class="profile-popup-role">
          ${profile.role}
        </div>

        <p>
          ${profile.bio}
        </p>

        <h4>
          Areas of Expertise
        </h4>

        <div class="profile-skills">

          ${profile.skills
            .map(skill => `<span>${skill}</span>`)
            .join("")}

        </div>

      </div>

    </div>
  `;

  profileModal.classList.add("active");
  profileModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

}


function closeProfile() {

  if (!profileModal) return;

  profileModal.classList.remove("active");
  profileModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");

}


document.querySelectorAll(".profile-trigger").forEach(card => {

  card.addEventListener("click", () => {
    openProfile(card.dataset.profile);
  });


  card.addEventListener("keydown", event => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      openProfile(card.dataset.profile);

    }

  });

});


document.querySelectorAll("[data-close-profile]").forEach(button => {

  button.addEventListener("click", closeProfile);

});


document.addEventListener("keydown", event => {

  if (
    event.key === "Escape" &&
    profileModal?.classList.contains("active")
  ) {

    closeProfile();

  }

});
/* =====================================================
   FACEBOOK MARKETING SHOWCASE ANIMATION
===================================================== */

(() => {

  const section =
    document.querySelector(".dm-showcase");

  if (!section) return;


  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  if (reduceMotion) {

    section.classList.add("is-active");

    return;

  }


  const observer =
    new IntersectionObserver(

      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            section.classList.add("is-active");

            observer.unobserve(section);

          }

        });

      },

      {
        threshold:0.20
      }

    );


  observer.observe(section);

})();
