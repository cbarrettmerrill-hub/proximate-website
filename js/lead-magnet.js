/* =========================================================
   Gated resource downloads (lead magnets)
   Any form with class "gate-form" and data-resource="<slug>" becomes a
   name + email gate. On submit, the server records the lead and returns a
   short-lived private link to the file, which then downloads.
   ========================================================= */
(function () {
  const ENDPOINT = "https://ghcccgnoquhgpdmnipfm.supabase.co/functions/v1/get-resource";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2NjZ25vcXVoZ3BkbW5pcGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyODU5NTksImV4cCI6MjEwMDg2MTk1OX0.7uYDAmDo4ltFLwvtIBfCTcUa_pOknaSsn9W1QEJ8-bg";
  const ERRORS = {
    invalid_first_name: "Please enter your first name.",
    invalid_last_name: "Please enter your last name.",
    invalid_email: "Please check your email address.",
    rate_limited: "Too many requests today. Please try again tomorrow.",
    resource_unavailable: "This resource isn't available right now. Please check back soon.",
    unknown_resource: "This resource isn't available right now."
  };

  document.querySelectorAll("form.gate-form").forEach(form => {
    const btn = form.querySelector("button[type=submit]");
    const label = btn.textContent;
    const errorBox = form.querySelector(".form-error");
    const done = document.getElementById(form.dataset.done);

    form.addEventListener("submit", async e => {
      e.preventDefault();
      for (const i of form.querySelectorAll("input[required]")) {
        if (!i.checkValidity()) { i.reportValidity(); return; }
      }
      btn.disabled = true; btn.textContent = "Preparing your download…"; errorBox.hidden = true;
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY, "apikey": KEY },
          body: JSON.stringify({
            resource: form.dataset.resource,
            first_name: form.elements.first_name.value.trim(),
            last_name: form.elements.last_name.value.trim(),
            email: form.elements.email.value.trim(),
            wants_updates: !!(form.elements.wants_updates && form.elements.wants_updates.checked),
            website_url: form.elements.website_url ? form.elements.website_url.value : ""
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || "failed");

        // Start the download, and offer a button in case the browser blocks it
        window.location.href = data.url;
        if (done) {
          const again = done.querySelector("a.download-again");
          if (again) again.href = data.url;
          form.hidden = true;
          done.hidden = false;
        }
      } catch (err) {
        errorBox.textContent = ERRORS[err.message] || "Sorry, something went wrong. Please try again.";
        errorBox.hidden = false;
        btn.disabled = false; btn.textContent = label;
      }
    });
  });

  // ----- Pop-up version (home page Resources section) -----
  // Any element with data-gate="<slug>" opens the shared download pop-up.
  const modal = document.getElementById("gateModal");
  if (modal) {
    const form = modal.querySelector("form.gate-form");
    const done = document.getElementById(form.dataset.done);
    const btn = form.querySelector("button[type=submit]");
    const title = modal.querySelector("[data-gate-title]");
    const open = (slug, name) => {
      form.dataset.resource = slug;
      title.textContent = name;
      form.hidden = false; done.hidden = true;
      form.querySelector(".form-error").hidden = true;
      btn.disabled = false; btn.textContent = "Download";
      modal.hidden = false;
      form.elements.first_name.focus();
    };
    const close = () => { modal.hidden = true; };
    document.querySelectorAll("[data-gate]").forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      open(el.dataset.gate, el.dataset.gateName || "Free resource");
    }));
    modal.querySelectorAll("[data-gate-close]").forEach(b => b.addEventListener("click", close));
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) close(); });
  }
})();
