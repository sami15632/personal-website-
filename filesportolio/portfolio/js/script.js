/* ==========================================================================
   SAMI — PORTFOLIO — shared behaviour across all pages
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    setActiveNav();
    setFooterYear();
    initMobileNav();
    initScrollReveal();
    initTiltCards();
    initHeroStage();
    initAmbientCanvases();
    initBackToTop();
    initContactForm();
    initCopyButtons();
  });

  /* ---------- active nav link ------------------------------------------ */
  function setActiveNav() {
    var current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (current === "") current = "index.html";
    document.querySelectorAll(".nav__link").forEach(function (link) {
      var href = (link.getAttribute("href") || "").toLowerCase();
      if (href === current) link.setAttribute("aria-current", "page");
    });
  }

  /* ---------- footer year ------------------------------------------------ */
  function setFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- mobile nav -------------------------------------------------- */
  function initMobileNav() {
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav__toggle");
    if (!nav || !toggle) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("nav--open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () { nav.classList.remove("nav--open"); });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") nav.classList.remove("nav--open");
    });
  }

  /* ---------- scroll reveal ------------------------------------------------ */
  function initScrollReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 60, 240) + "ms";
      observer.observe(el);
    });
  }

  /* ---------- generic 3D tilt for cards ------------------------------------ */
  function initTiltCards() {
    if (!canHover || reduceMotion) return;
    var cards = document.querySelectorAll(".tilt-card");

    cards.forEach(function (card) {
      var max = 8;
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (py - 0.5) * -max;
        var ry = (px - 0.5) * max;
        card.style.transform = "perspective(700px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
        card.style.setProperty("--mx", (px * 100) + "%");
        card.style.setProperty("--my", (py * 100) + "%");
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "perspective(700px) rotateX(0) rotateY(0) translateY(0)";
      });
    });
  }

  /* ---------- hero portrait parallax stage --------------------------------- */
  function initHeroStage() {
    var stage = document.querySelector("[data-hero-stage]");
    if (!stage) return;
    var layers = stage.querySelectorAll(".stage__layer");

    if (!canHover || reduceMotion) return; // ambient CSS float keyframes still run

    stage.addEventListener("mousemove", function (e) {
      var rect = stage.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;

      layers.forEach(function (layer, i) {
        var depth = (i + 1) * 10;
        var rx = py * -depth * 0.6;
        var ry = px * depth * 0.6;
        var tx = px * depth * 0.4;
        var ty = py * depth * 0.4;
        layer.style.transform = "translate3d(" + tx + "px," + ty + "px,0) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
    });

    stage.addEventListener("mouseleave", function () {
      layers.forEach(function (layer) { layer.style.transform = ""; });
    });
  }

  /* ---------- ambient ember-particle canvases ------------------------------- */
  function initAmbientCanvases() {
    document.querySelectorAll("canvas[data-particles]").forEach(function (canvas) {
      var density = parseInt(canvas.getAttribute("data-particles"), 10) || 40;
      mountParticles(canvas, density);
    });
  }

  function mountParticles(canvas, density) {
    var ctx = canvas.getContext("2d");
    var particles = [];
    var w, h, raf, running = true;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
    }

    function spawn() {
      particles = [];
      var count = reduceMotion ? 0 : (w < 640 ? Math.round(density * 0.5) : density);
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.6 + 0.4,
          speed: Math.random() * 0.35 + 0.08,
          sway: Math.random() * 1.2 + 0.3,
          phase: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.5 + 0.15
        });
      }
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var t = Date.now() * 0.001;
      particles.forEach(function (p) {
        p.y -= p.speed;
        if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        var x = p.x + Math.sin(t + p.phase) * p.sway;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,140,100," + p.alpha + ")";
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); spawn(); }, 200);
    });

    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) tick(); else cancelAnimationFrame(raf);
    });

    resize();
    spawn();
    if (!reduceMotion) tick();
  }

  /* ---------- back to top --------------------------------------------------- */
  function initBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("is-visible", window.scrollY > 480);
    });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- contact form --------------------------------------------------- */
  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    var status = form.querySelector(".form__status");
    var destinationEmail = form.getAttribute("data-to") || "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var message = form.querySelector("#message");
      var valid = true;

      [name, email, message].forEach(function (field) {
        var errorEl = field.closest(".field").querySelector(".field__error");
        errorEl.textContent = "";
        if (!field.value.trim()) {
          errorEl.textContent = "This field is required.";
          valid = false;
        }
      });

      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email.closest(".field").querySelector(".field__error").textContent = "Enter a valid email address.";
        valid = false;
      }

      if (!valid) {
        status.textContent = "Please fix the highlighted fields.";
        status.classList.remove("is-success");
        return;
      }

      var submitBtn = form.querySelector("button[type='submit']");
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = "sending…";
      submitBtn.disabled = true;

      setTimeout(function () {
        if (destinationEmail) {
          var subject = encodeURIComponent("Portfolio contact from " + name.value.trim());
          var body = encodeURIComponent(message.value.trim() + "\n\n— " + name.value.trim() + " (" + email.value.trim() + ")");
          window.location.href = "mailto:" + destinationEmail + "?subject=" + subject + "&body=" + body;
          status.textContent = "Your email app should be opening now. Prefer chat? Reach me on Telegram or GitHub above.";
        } else {
          status.textContent = "Thanks, " + name.value.trim() + "! Email isn't connected yet — the fastest way to reach me right now is Telegram or GitHub above.";
        }
        status.classList.add("is-success");
        submitBtn.textContent = originalLabel;
        submitBtn.disabled = false;
        form.reset();
      }, 600);
    });
  }

  /* ---------- copy-to-clipboard buttons ---------------------------------------- */
  function initCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-copy");
        var original = btn.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(function () {
            btn.textContent = "copied";
            setTimeout(function () { btn.textContent = original; }, 1600);
          });
        }
      });
    });
  }
})();
