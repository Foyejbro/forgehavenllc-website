document.addEventListener("DOMContentLoaded", () => {
  const waBtn = document.getElementById("waBtn");
  if (!waBtn) return;

  const fields = ["name", "platform", "budget", "goal", "details"];

  function updateWA() {
    const values = {};
    fields.forEach(id => {
      const el = document.getElementById(id);
      values[id] = el ? el.value.trim() : "";
    });

    const msg =
`Hi Forge Haven, I want this service.

Name: ${values.name}
Platform: ${values.platform}
Budget: ${values.budget}
Goal: ${values.goal}
Requirements: ${values.details}`;

    waBtn.href = `https://wa.me/8801639444747?text=${encodeURIComponent(msg)}`;
  }

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateWA);
  });

  updateWA();
});
