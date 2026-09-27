/* 180 Degrees Consulting WashU — interactions and motion */
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");
  window.siteReady = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  const headerHeight = () => parseFloat(getComputedStyle(root).getPropertyValue("--header-h")) || 72;

  /* ---------- One animation-frame loop for everything scroll-linked ---------- */
  const scrollTasks = [];
  let ticking = false;
  const runScrollTasks = () => {
    ticking = false;
    for (const task of scrollTasks) task();
  };
  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(runScrollTasks);
    }
  };
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);

  const onResize = (fn) => {
    let timer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(fn, 150);
    });
  };

  /* ---------- Smooth scrolling for mouse wheels and trackpads ----------
     The page still scrolls natively (keyboard, scrollbar, touch, find-in-page);
     wheel input is eased toward its target so scroll-linked motion stays fluid. */
  const smooth = (() => {
    if (reducedMotion || !finePointer) return null;
    root.style.scrollBehavior = "auto";
    let target = window.scrollY;
    let current = window.scrollY;
    let running = false;
    let last = 0;
    const maxScroll = () => root.scrollHeight - window.innerHeight;
    const canScrollInside = (el, dy) => {
      for (; el && el !== document.body && el !== root; el = el.parentElement) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) {
          if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop < el.scrollHeight - el.clientHeight - 1)) return true;
        }
      }
      return false;
    };
    const step = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      current += (target - current) * (1 - Math.exp(-dt * 10));
      if (Math.abs(target - current) < 0.5) {
        current = target;
        running = false;
      }
      window.scrollTo(0, current);
      if (running) requestAnimationFrame(step);
      else last = 0;
    };
    const go = (y) => {
      if (!running) current = target = window.scrollY;
      target = Math.max(0, Math.min(maxScroll(), y));
      if (!running) {
        running = true;
        requestAnimationFrame(step);
      }
    };
    window.addEventListener("wheel", (event) => {
      if (event.ctrlKey || event.defaultPrevented) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (document.body.classList.contains("menu-open")) return;
      if (canScrollInside(event.target, event.deltaY)) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1;
      go((running ? target : window.scrollY) + event.deltaY * unit);
    }, { passive: false });
    window.addEventListener("scroll", () => {
      if (!running) current = target = window.scrollY;
    }, { passive: true });
    // In-page links glide too
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented) return;
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const el = id && document.getElementById(id);
      if (!el) return;
      event.preventDefault();
      go(el.getBoundingClientRect().top + window.scrollY - (id === "main" ? 0 : headerHeight()));
      history.pushState(null, "", `#${id}`);
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    });
    return { go };
  })();

  /* ---------- Header: glass once scrolled, dark or light to match the ground,
     tucked away while reading down the page ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const darkZones = [...document.querySelectorAll(".hero, .cta, .site-footer")];
    let lastY = window.scrollY;
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
    scrollTasks.push(() => {
      const y = window.scrollY;
      const probe = headerHeight() / 2;
      const onDark = darkZones.some((zone) => {
        const r = zone.getBoundingClientRect();
        return r.top <= probe && r.bottom > probe;
      });
      header.classList.toggle("is-on-dark", onDark);
      header.classList.toggle("is-solid", y > 12);
      if (!document.body.classList.contains("menu-open")) {
        if (y > window.innerHeight * 0.8 && y > lastY + 4) header.classList.add("is-hidden");
        else if (y < lastY - 4 || y < window.innerHeight * 0.8) header.classList.remove("is-hidden");
      }
      lastY = y;
    });
  }

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("menu");
  if (menuToggle && menu) {
    const setMenu = (open) => {
      document.body.classList.toggle("menu-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.inert = !open;
      if (open && header) header.classList.remove("is-hidden");
    };
    menu.inert = true;
    menuToggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });
  }

  /* ---------- Page load: headlines rise word by word out of a mask ---------- */
  const split = (el) => {
    // Keep deliberate line breaks (<br>) and wrap every word in a mask
    const nodes = [...el.childNodes];
    el.textContent = "";
    let index = 0;
    nodes.forEach((node) => {
      if (node.nodeName === "BR") {
        el.appendChild(document.createElement("br"));
        return;
      }
      const words = node.textContent.trim().split(/\s+/).filter(Boolean);
      words.forEach((word, i) => {
        const outer = document.createElement("span");
        outer.className = "split-w";
        const inner = document.createElement("span");
        inner.textContent = word;
        inner.style.setProperty("--w", index++);
        outer.appendChild(inner);
        el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
    });
    el.classList.add("is-split");
  };
  const splits = [...document.querySelectorAll("[data-split]")];
  if (!reducedMotion) splits.forEach(split);
  // Start the load sequence once fonts are in. It must not wait on animation
  // frames (background tabs pause them), and a timer covers anything else.
  const showPage = () => {
    if (document.body.classList.contains("is-loaded")) return;
    void document.body.offsetWidth; // commit the hidden start state so the transitions run
    document.body.classList.add("is-loaded");
    splits.forEach((el) => el.classList.add("is-in"));
  };
  fontsReady.then(showPage);
  setTimeout(showPage, 2500);

  /* ---------- Reveals as things scroll into view ---------- */
  const reveals = document.querySelectorAll("[data-reveal]");
  if (!reducedMotion && "IntersectionObserver" in window) {
    const revealer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    reveals.forEach((el) => revealer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Parallax: photos drift inside their frames ---------- */
  const parallax = [...document.querySelectorAll("[data-parallax]")];
  if (parallax.length && !reducedMotion && "IntersectionObserver" in window) {
    const visible = new Set();
    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
      requestTick();
    }, { rootMargin: "10% 0px" });
    parallax.forEach((el) => watcher.observe(el.parentElement));
    scrollTasks.push(() => {
      const vh = window.innerHeight;
      const moves = [];
      for (const el of parallax) {
        if (!visible.has(el.parentElement)) continue;
        const r = el.parentElement.getBoundingClientRect();
        moves.push([el, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)]);
      }
      for (const [el, t] of moves) el.style.setProperty("--py", `${(-t * 5).toFixed(2)}%`);
    });
  }

  /* ---------- Mission: the statement fills in as you read it ---------- */
  document.querySelectorAll("[data-fill]").forEach((el) => {
    if (reducedMotion) return;
    const words = el.textContent.trim().replace(/\s+/g, " ").split(" ");
    el.textContent = "";
    const spans = words.map((word, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return span;
    });
    const soft = 5;
    const last = new Array(spans.length).fill(-1);
    scrollTasks.push(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const head = p * (spans.length + soft);
      spans.forEach((span, i) => {
        const o = Math.round((0.22 + 0.78 * clamp01((head - i) / soft)) * 100) / 100;
        if (o !== last[i]) {
          last[i] = o;
          span.style.opacity = o;
        }
      });
    });
  });

  /* ---------- Numbers count up once visible ---------- */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const value = el.closest(".stat__value");
    if (value) {
      // Screen readers get the final figure; the animated digits are decoration
      const spoken = document.createElement("span");
      spoken.className = "visually-hidden";
      spoken.textContent = value.textContent.trim();
      const shown = document.createElement("span");
      shown.setAttribute("aria-hidden", "true");
      while (value.firstChild) shown.appendChild(value.firstChild);
      value.append(spoken, shown);
    }
    const target = parseInt(el.dataset.count, 10);
    // Counting up to 1 would only flash "0st", so small numbers stay as they are
    if (reducedMotion || !("IntersectionObserver" in window) || !(target > 1)) return;
    el.textContent = "0";
    const counter = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      counter.disconnect();
      const start = performance.now();
      const duration = 1400 + Math.min(target, 200) * 3;
      const step = (now) => {
        const t = clamp01((now - start) / duration);
        el.textContent = String(Math.round(target * easeOut(t)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0 });
    counter.observe(el);
  });

  /* ---------- Home hero: the 180 DC globe floats, drifts with the page and
     leans a little toward the pointer ---------- */
  const float = document.querySelector(".hero__float");
  if (float && !reducedMotion) {
    let target = [0, 0];
    let current = [0, 0];
    let leaning = false;
    const lean = () => {
      current = current.map((v, i) => v + (target[i] - v) * 0.08);
      float.style.setProperty("--px", `${(current[0] * 18).toFixed(2)}px`);
      float.style.setProperty("--py", `${(current[1] * 14).toFixed(2)}px`);
      float.style.setProperty("--pr", `${(current[0] * 4).toFixed(2)}deg`);
      leaning = Math.abs(target[0] - current[0]) + Math.abs(target[1] - current[1]) > 0.001;
      if (leaning) requestAnimationFrame(lean);
    };
    if (finePointer) {
      window.addEventListener("pointermove", (event) => {
        target = [event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5];
        if (!leaning) {
          leaning = true;
          requestAnimationFrame(lean);
        }
      }, { passive: true });
    }
    scrollTasks.push(() => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.5) float.style.setProperty("--sy", `${(y * 0.18).toFixed(1)}px`);
    });
  }

  /* ---------- Services: the capability index follows the one being read ---------- */
  const capLinks = [...document.querySelectorAll(".caps__jump")];
  if (capLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(capLinks.map((link) => [link.getAttribute("href").slice(1), link]));
    const reader = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        capLinks.forEach((link) => link.removeAttribute("aria-current"));
        const link = byId.get(entry.target.id);
        if (link) link.setAttribute("aria-current", "true");
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".cap").forEach((panel) => reader.observe(panel));
  }

  /* ---------- People strip: drag, swipe or use the arrows ---------- */
  document.querySelectorAll(".strip").forEach((strip) => {
    const section = strip.closest("section");
    const prev = section.querySelector('[data-strip="prev"]');
    const next = section.querySelector('[data-strip="next"]');
    const stepSize = () => {
      const card = strip.querySelector(".person");
      return card ? card.getBoundingClientRect().width + 24 : 300;
    };
    const update = () => {
      if (prev) prev.disabled = strip.scrollLeft < 4;
      if (next) next.disabled = strip.scrollLeft > strip.scrollWidth - strip.clientWidth - 4;
    };
    const behavior = reducedMotion ? "auto" : "smooth";
    if (prev) prev.addEventListener("click", () => strip.scrollBy({ left: -stepSize() * 2, behavior }));
    if (next) next.addEventListener("click", () => strip.scrollBy({ left: stepSize() * 2, behavior }));
    strip.addEventListener("scroll", update, { passive: true });
    onResize(update);
    update();

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    strip.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startLeft = strip.scrollLeft;
    });
    window.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        strip.classList.add("is-dragging");
      }
      if (moved) strip.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      strip.classList.remove("is-dragging");
    });
    strip.addEventListener("click", (event) => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    }, true);
    strip.addEventListener("dragstart", (event) => event.preventDefault());
  });

  /* ---------- Recruitment timeline fills as you read ---------- */
  document.querySelectorAll(".timeline").forEach((timeline) => {
    const steps = [...timeline.querySelectorAll(".step")];
    const vertical = window.matchMedia("(max-width: 900px)");
    const update = () => {
      const r = timeline.getBoundingClientRect();
      const p = reducedMotion ? 1 : clamp01((window.innerHeight * 0.78 - r.top) / (r.height * 0.8 + window.innerHeight * 0.25));
      timeline.style.setProperty("--progress", p.toFixed(3));
      steps.forEach((step) => {
        const at = vertical.matches ? step.offsetTop / timeline.clientHeight : step.offsetLeft / timeline.clientWidth;
        step.classList.toggle("is-reached", p >= at - 0.01);
      });
    };
    scrollTasks.push(update);
    update();
  });

  /* ---------- FAQ ---------- */
  const setAnswer = (button, open) => {
    const answer = document.getElementById(button.getAttribute("aria-controls"));
    if (!answer) return;
    button.setAttribute("aria-expanded", String(open));
    if (reducedMotion) {
      answer.hidden = !open;
      return;
    }
    if (open) {
      answer.hidden = false;
      answer.style.height = "0px";
      void answer.offsetHeight;
      answer.style.height = `${answer.scrollHeight}px`;
    } else {
      answer.style.height = `${answer.scrollHeight}px`;
      void answer.offsetHeight;
      answer.style.height = "0px";
    }
    answer.addEventListener("transitionend", function done(event) {
      if (event.propertyName !== "height") return;
      answer.removeEventListener("transitionend", done);
      if (button.getAttribute("aria-expanded") === "false") answer.hidden = true;
      answer.style.height = "";
    });
  };
  document.querySelectorAll(".faq__q").forEach((button) => {
    button.addEventListener("click", () => setAnswer(button, button.getAttribute("aria-expanded") !== "true"));
  });

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
        `Organization: ${value("company")}`,
        `Name: ${value("name")}`,
        `Role: ${value("relation")}`,
        `Email: ${value("email")}`,
        "",
        value("description"),
      ].join("\n");
      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const status = form.querySelector(".form__status");
      if (status) status.textContent = "Your email app should open with your message ready to send.";
    });
  });

  requestTick();
})();
