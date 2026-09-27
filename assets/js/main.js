/* 180 Degrees Consulting WashU — site behaviour */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector(".header-burger");
  const menu = document.getElementById("mobile-menu");

  if (burger && menu) {
    const setMenuOpen = (open) => {
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close Menu" : "Open Menu");
      menu.inert = !open;
    };

    menu.inert = true;
    burger.addEventListener("click", () => {
      setMenuOpen(!document.body.classList.contains("menu-open"));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });
    window.matchMedia("(min-width: 800px)").addEventListener("change", (event) => {
      if (event.matches) setMenuOpen(false);
    });
  }

  /* ---------- Accordions (one item open at a time) ---------- */
  const setPanel = (trigger, open) => {
    const panel = document.getElementById(trigger.getAttribute("aria-controls"));
    if (!panel) return;
    trigger.setAttribute("aria-expanded", String(open));

    if (reducedMotion.matches) {
      panel.hidden = !open;
      panel.style.height = "";
      return;
    }

    if (open) {
      panel.hidden = false;
      panel.style.height = "0px";
      void panel.offsetHeight;
      panel.style.height = panel.scrollHeight + "px";
    } else {
      panel.style.height = panel.scrollHeight + "px";
      void panel.offsetHeight;
      panel.style.height = "0px";
    }

    panel.addEventListener("transitionend", function done(event) {
      if (event.propertyName !== "height") return;
      panel.removeEventListener("transitionend", done);
      if (trigger.getAttribute("aria-expanded") === "true") {
        panel.style.height = "";
      } else {
        panel.hidden = true;
        panel.style.height = "";
      }
    });
  };

  document.querySelectorAll(".accordion").forEach((accordion) => {
    accordion.addEventListener("click", (event) => {
      const trigger = event.target.closest(".accordion-trigger");
      if (!trigger) return;
      const open = trigger.getAttribute("aria-expanded") !== "true";
      if (open) {
        accordion.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach((other) => {
          if (other !== trigger) setPanel(other, false);
        });
      }
      setPanel(trigger, open);
    });
  });

  /* ---------- Animated bokeh background ---------- */
  const mulberry32 = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const initBokeh = (canvas) => {
    const section = canvas.closest(".section");
    const toggle = section && section.querySelector(".bokeh-toggle");
    const ctx = canvas.getContext("2d");
    const styles = getComputedStyle(document.documentElement);
    const color = (name) => styles.getPropertyValue(name).trim();
    const palette = {
      background: color("--accent"),
      dark: color("--dark-accent"),
      light: color("--light-accent"),
      white: "#fff",
    };

    let width = 0;
    let height = 0;
    let particles = [];
    let blobs = [];
    let running = !reducedMotion.matches;
    let frame = 0;
    let lastTime = 0;

    const build = () => {
      const random = mulberry32(Number(canvas.dataset.seed) || 1);
      const count = Math.round((width * height) / 8000);
      particles = Array.from({ length: count }, () => {
        const small = random() < 0.85;
        return {
          x: random() * width,
          y: random() * height,
          r: small ? 1 + random() * 3 : 4 + random() * 7,
          vx: (random() - 0.5) * 8,
          vy: -3 - random() * 9,
          alpha: 0.12 + random() * 0.35,
          phase: random() * Math.PI * 2,
          color: random() < 0.7 ? palette.white : palette.light,
        };
      });
      blobs = Array.from({ length: 5 }, () => ({
        x: random() * width,
        y: random() * height,
        r: 90 + random() * 160,
        vx: (random() - 0.5) * 4,
        vy: (random() - 0.5) * 4,
        alpha: 0.06 + random() * 0.06,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      draw(0, 0);
    };

    const softCircle = (x, y, r, fill, alpha) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, fill);
      gradient.addColorStop(0.55, fill);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = (dt, time) => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, width, height);

      // Soft light source to the right of centre
      const light = ctx.createRadialGradient(width * 0.72, height * 0.35, 0, width * 0.72, height * 0.35, Math.max(width, height) * 0.7);
      light.addColorStop(0, "rgba(255,255,255,0.14)");
      light.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, width, height);

      // Large dark accent blobs for depth
      for (const blob of blobs) {
        blob.x += blob.vx * dt;
        blob.y += blob.vy * dt;
        if (blob.x < -blob.r) blob.x = width + blob.r;
        if (blob.x > width + blob.r) blob.x = -blob.r;
        if (blob.y < -blob.r) blob.y = height + blob.r;
        if (blob.y > height + blob.r) blob.y = -blob.r;
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        gradient.addColorStop(0, palette.dark);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = blob.alpha;
        ctx.fillStyle = gradient;
        ctx.fillRect(blob.x - blob.r, blob.y - blob.r, blob.r * 2, blob.r * 2);
      }

      // Shade along the top edge
      ctx.globalAlpha = 1;
      const shade = ctx.createLinearGradient(0, 0, 0, 60);
      shade.addColorStop(0, "rgba(28, 44, 17, 0.35)");
      shade.addColorStop(1, "rgba(28, 44, 17, 0)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, width, 60);

      // Floating particles
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < -p.r) { p.y = height + p.r; }
        if (p.x < -p.r) { p.x = width + p.r; }
        if (p.x > width + p.r) { p.x = -p.r; }
        const twinkle = 0.75 + 0.25 * Math.sin(p.phase + time * 0.0012);
        softCircle(p.x, p.y, p.r, p.color, p.alpha * twinkle);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (time) => {
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;
      draw(dt, time);
      frame = requestAnimationFrame(loop);
    };

    const setRunning = (value) => {
      running = value;
      if (toggle) {
        toggle.setAttribute("aria-pressed", String(!running));
        toggle.setAttribute("aria-label", running ? "Pause background animation" : "Play background animation");
      }
      cancelAnimationFrame(frame);
      lastTime = 0;
      if (running) frame = requestAnimationFrame(loop);
    };

    new ResizeObserver(resize).observe(canvas);
    resize();
    setRunning(running);

    if (toggle) toggle.addEventListener("click", () => setRunning(!running));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else if (running) { lastTime = 0; frame = requestAnimationFrame(loop); }
    });
  };

  document.querySelectorAll(".bokeh-canvas").forEach(initBokeh);

  /* ---------- Contact form ----------
     A static site has no form backend, so the form opens the visitor's email
     app with the message filled in. Change data-mailto to route it elsewhere. */
  document.querySelectorAll("form[data-mailto]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const value = (name) => (data.get(name) || "").toString().trim();
      const subject = `Project inquiry from ${value("company")}`;
      const body = [
        `Company Name: ${value("company")}`,
        `Name: ${value("first_name")} ${value("last_name")}`,
        `Relation to Company: ${value("relation")}`,
        `Email: ${value("email")}`,
        "",
        "Description of Project:",
        value("description"),
      ].join("\n");

      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const status = form.querySelector(".form-status");
      if (status) status.textContent = "Thank you! Your email app should open with your message ready to send.";
    });
  });
})();
