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
    invalid_name: "Please enter your name.",
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
            name: form.elements.name.value.trim(),
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
})();
