(function () {
  "use strict";

  const doc = document.documentElement;
  const header = document.querySelector("[data-site-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navToggleLabel = document.querySelector("[data-nav-toggle-label]");
  const navPanel = document.querySelector("[data-nav-panel]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionDuration = prefersReducedMotion ? 0 : 240;

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  setHeaderState();
  let headerFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (headerFrame) return;
      headerFrame = window.requestAnimationFrame(() => {
        headerFrame = 0;
        setHeaderState();
      });
    },
    { passive: true }
  );

  let navCloseTimer = 0;

  const openNav = () => {
    if (!navPanel || !navToggle) return;
    window.clearTimeout(navCloseTimer);
    navPanel.hidden = false;
    navPanel.classList.remove("is-open");
    if (!prefersReducedMotion) navPanel.offsetHeight;
    navPanel.classList.add("is-open");
    navPanel.scrollTop = 0;
    doc.classList.add("has-nav-open");
    if (header) header.classList.add("is-nav-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Navigation schliessen");
    if (navToggleLabel) navToggleLabel.textContent = "Navigation schliessen";
  };

  const closeNav = () => {
    if (!navPanel || !navToggle) return;
    window.clearTimeout(navCloseTimer);
    navPanel.classList.remove("is-open");
    doc.classList.remove("has-nav-open");
    if (header) header.classList.remove("is-nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Navigation öffnen");
    if (navToggleLabel) navToggleLabel.textContent = "Navigation öffnen";
    navCloseTimer = window.setTimeout(() => {
      if (!navPanel.classList.contains("is-open")) navPanel.hidden = true;
    }, motionDuration);
  };

  if (navToggle && navPanel) {
    navToggle.addEventListener("click", () => {
      navPanel.classList.contains("is-open") ? closeNav() : openNav();
    });

    navPanel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("click", (event) => {
      if (!navPanel.classList.contains("is-open")) return;
      if (header && header.contains(event.target)) return;
      if (navPanel.contains(event.target)) return;
      closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navPanel.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    const mq = window.matchMedia("(min-width: 1181px)");
    const handleMq = () => {
      if (mq.matches) closeNav();
    };
    mq.addEventListener ? mq.addEventListener("change", handleMq) : mq.addListener(handleMq);
  }

  const revealTargets = document.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  } else {
    doc.classList.add("motion-enabled");
    const revealElement = (el) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          el.classList.add("is-visible");
        });
      });
    };
    const groups = new Map();
    revealTargets.forEach((el) => {
      const parent = el.parentElement || document.body;
      const items = groups.get(parent) || [];
      items.push(el);
      groups.set(parent, items);
    });
    groups.forEach((items) => {
      items.forEach((el, index) => {
        el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 60}ms`);
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealElement(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.04, rootMargin: "0px 0px -2% 0px" }
    );

    revealTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        revealElement(el);
      } else {
        observer.observe(el);
      }
    });

    window.setTimeout(() => {
      revealTargets.forEach((el) => {
        if (el.classList.contains("is-visible")) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.1 && rect.bottom > -80) {
          revealElement(el);
        }
      });
    }, 1400);
  }

  document.querySelectorAll(".faq-item").forEach((details) => {
    const summary = details.querySelector("summary");
    if (!summary || prefersReducedMotion) return;

    const animationMs = 380;
    let closeTimer = 0;
    details.dataset.faqReady = "true";
    details.classList.toggle("is-open", details.open);
    summary.setAttribute("aria-expanded", details.open ? "true" : "false");

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      window.clearTimeout(closeTimer);

      if (details.open && details.classList.contains("is-open")) {
        details.classList.add("is-closing");
        details.classList.remove("is-open", "is-opening");
        summary.setAttribute("aria-expanded", "false");
        closeTimer = window.setTimeout(() => {
          details.open = false;
          details.classList.remove("is-closing");
        }, animationMs);
        return;
      }

      details.open = true;
      details.classList.remove("is-closing");
      details.classList.add("is-opening");
      summary.setAttribute("aria-expanded", "true");
      window.requestAnimationFrame(() => {
        details.classList.add("is-open");
        window.setTimeout(() => details.classList.remove("is-opening"), animationMs);
      });
    });
  });

  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    const endpoint = form.dataset.formEndpoint || form.getAttribute("action");
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector("button[type='submit']");
    const submitSeconds = form.querySelector("[data-submit-seconds]");
    const submitLabel = submit ? submit.dataset.submitLabel || submit.textContent.trim() : "";
    const formReadyAt = Date.now();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!endpoint) return;

      const elapsed = Date.now() - formReadyAt;
      if (submitSeconds) submitSeconds.value = String(Math.round(elapsed / 1000));

      if (!form.checkValidity()) {
        form.classList.remove("is-invalid-pulse");
        void form.offsetWidth;
        form.classList.add("is-invalid-pulse");
        form.reportValidity();
        return;
      }

      if (elapsed < 1500) {
        if (status) {
          status.className = "form__status is-error";
          status.textContent = "Bitte prüfen Sie Ihre Angaben kurz und senden Sie die Anfrage danach erneut.";
        }
        return;
      }

      if (status) {
        status.className = "form__status";
        status.textContent = "Ihre Anfrage wird gesendet...";
      }
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Anfrage wird gesendet...";
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(new FormData(form)).toString(),
        });

        if (!response.ok) throw new Error("Formular konnte nicht gesendet werden.");

        form.reset();
        if (status) {
          status.className = "form__status is-success";
          status.textContent = "Danke. Ihre Anfrage ist angekommen. Wir prüfen die Angaben persönlich und melden uns für Rückfragen, Besichtigung oder Offerte.";
        }
      } catch (error) {
        if (status) {
          status.className = "form__status is-error";
          status.textContent = "Die Anfrage konnte gerade nicht gesendet werden. Bitte rufen Sie 079 531 08 16 an oder schreiben Sie an info@handwerkspartner24.ch.";
        }
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = `${submitLabel}<svg class="icon icon--arrow-right" width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>`;
        }
      }
    });
  });

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxCaption = document.querySelector("[data-lightbox-caption]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");
  let lastLightboxTrigger = null;
  const lightboxFocusableSelector = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

  const trapLightboxFocus = (event) => {
    if (!lightbox || lightbox.hidden || event.key !== "Tab") return;
    const focusables = Array.from(lightbox.querySelectorAll(lightboxFocusableSelector)).filter((el) => {
      return !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden");
    });
    if (!focusables.length) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const lightboxPrev = document.querySelector("[data-lightbox-prev]");
  const lightboxNext = document.querySelector("[data-lightbox-next]");
  let lightboxGroup = [];
  let lightboxIndex = 0;

  const renderLightboxImage = () => {
    const trigger = lightboxGroup[lightboxIndex];
    if (!trigger || !lightboxImage) return;
    lightboxImage.src = trigger.dataset.lightboxSrc || "";
    lightboxImage.alt = trigger.dataset.lightboxAlt || "";
    if (lightboxCaption) lightboxCaption.textContent = trigger.dataset.lightboxCaption || "";
    const multiple = lightboxGroup.length > 1;
    if (lightboxPrev) lightboxPrev.hidden = !multiple;
    if (lightboxNext) lightboxNext.hidden = !multiple;
  };

  const openLightbox = (trigger) => {
    if (!lightbox || !lightboxImage) return;
    lastLightboxTrigger = trigger;
    const groupRoot = trigger.closest(".project-card__images");
    lightboxGroup = groupRoot
      ? Array.from(groupRoot.querySelectorAll("[data-lightbox-src]"))
      : [trigger];
    lightboxIndex = Math.max(0, lightboxGroup.indexOf(trigger));
    renderLightboxImage();
    lightbox.hidden = false;
    doc.classList.add("has-lightbox-open");
    if (lightboxClose) lightboxClose.focus();
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    lightbox.hidden = true;
    lightboxImage.src = "";
    doc.classList.remove("has-lightbox-open");
    if (lastLightboxTrigger) lastLightboxTrigger.focus();
  };

  const stepLightbox = (delta) => {
    if (lightboxGroup.length < 2) return;
    lightboxIndex = (lightboxIndex + delta + lightboxGroup.length) % lightboxGroup.length;
    renderLightboxImage();
  };

  document.querySelectorAll("[data-lightbox-src]").forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", () => stepLightbox(-1));
  if (lightboxNext) lightboxNext.addEventListener("click", () => stepLightbox(1));
  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (!lightbox || lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    else if (event.key === "ArrowLeft") stepLightbox(-1);
    else if (event.key === "ArrowRight") stepLightbox(1);
    trapLightboxFocus(event);
  });

  const initBadgeOrbit = () => {
    const orbits = Array.from(document.querySelectorAll("[data-badge-orbit]"));
    if (!orbits.length) return;

    const normalizeLength = (value, fallback) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const normalizeDuration = (value, fallback) => {
      const parsed = Number.parseFloat(value);
      if (!Number.isFinite(parsed)) return fallback;
      return value.trim().endsWith("ms") ? parsed : parsed * 1000;
    };

    const setupOrbit = (orbit) => {
      if (orbit.dataset.orbitReady === "true") return;
      orbit.dataset.orbitReady = "true";

      const rail = orbit.querySelector(".site-footer__badge-orbit-rail");
      const traces = Array.from(orbit.querySelectorAll(".site-footer__badge-orbit-trace"));
      if (!rail || traces.length < 2 || typeof rail.getTotalLength !== "function") return;

      const badge = orbit.closest(".site-footer__badge") || orbit;
      const styles = window.getComputedStyle(badge);
      const total = rail.getTotalLength();
      const baseTraceLength = total * (normalizeLength(styles.getPropertyValue("--badge-trace-length"), 8) / 100);
      const baseOpacity = normalizeLength(styles.getPropertyValue("--badge-trace-opacity"), 0.67);
      const duration = normalizeDuration(styles.getPropertyValue("--badge-orbit-duration"), 6800);
      let animationFrame = 0;
      let lastTimestamp = 0;
      let distance = 0;

      const pointAt = (value) => {
        const normalized = ((value % total) + total) % total;
        return rail.getPointAtLength(normalized);
      };

      const sideBiasAt = (value) => {
        const phase = (((value / total) % 1) + 1) % 1;
        const sideBias = Math.sin(phase * Math.PI * 2);
        return sideBias * sideBias;
      };

      const getMotionState = (value) => {
        const sideBias = sideBiasAt(value);
        return {
          length: baseTraceLength * (0.5 + sideBias * 1.5),
          opacity: Math.min(1, baseOpacity * (1 + sideBias * 0.5)),
          speed: 0.5 + sideBias * 1.5,
        };
      };

      const buildTrace = (center, length) => {
        let path = "";
        const steps = Math.max(10, Math.ceil(length / 1.25));
        const start = center - length / 2;
        for (let index = 0; index <= steps; index += 1) {
          const point = pointAt(start + (length * index) / steps);
          path += `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
        }
        return path.trim();
      };

      const draw = (value) => {
        const state = getMotionState(value);
        traces[0].setAttribute("d", buildTrace(value, state.length));
        traces[1].setAttribute("d", buildTrace(value + total / 2, state.length));
        traces.forEach((trace) => {
          trace.style.opacity = state.opacity.toFixed(3);
        });
      };

      draw(0);
      orbit.classList.add("is-ready");
      if (prefersReducedMotion) return;

      const tick = (timestamp) => {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const elapsed = timestamp - lastTimestamp;
        const state = getMotionState(distance);
        distance = (distance + (total * elapsed * state.speed) / duration) % total;
        draw(distance);
        lastTimestamp = timestamp;
        animationFrame = window.requestAnimationFrame(tick);
      };

      animationFrame = window.requestAnimationFrame(tick);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        } else if (!document.hidden && !animationFrame) {
          lastTimestamp = 0;
          animationFrame = window.requestAnimationFrame(tick);
        }
      });
    };

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      orbits.forEach(setupOrbit);
      return;
    }

    const orbitObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setupOrbit(entry.target);
          orbitObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "240px 0px", threshold: 0 }
    );
    orbits.forEach((orbit) => orbitObserver.observe(orbit));
  };

  initBadgeOrbit();
})();
