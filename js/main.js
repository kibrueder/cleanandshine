(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const formSuccess = document.getElementById("form-success");
  if (formSuccess && new URLSearchParams(window.location.search).get("success") === "1") {
    formSuccess.hidden = false;
  }

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.getElementById("mobile-panel");
  const nav = document.querySelector(".site-nav");
  const headerCta = document.querySelector(".header-cta");

  const closeMenu = () => {
    if (!toggle || !panel) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menü öffnen");
    panel.classList.remove("is-open");
    nav?.classList.remove("is-open");
    headerCta?.classList.remove("is-open");
  };

  const openMenu = () => {
    if (!toggle || !panel) return;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Menü schließen");
    panel.classList.add("is-open");
    nav?.classList.add("is-open");
    headerCta?.classList.add("is-open");
  };

  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (open) closeMenu();
      else openMenu();
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  const overflowNav = document.querySelector("[data-overflow-nav]");
  if (overflowNav) {
    const list = overflowNav.querySelector(":scope > ul");
    const more = overflowNav.querySelector(".nav-more");
    const moreMenu = more?.querySelector(".dropdown");
    const moreBtn = more?.querySelector(".nav-more-btn");
    const items = list ? [...list.children].filter((li) => !li.classList.contains("nav-more")) : [];
    const mobileQuery = window.matchMedia("(max-width: 860px)");
    let frame = 0;

    const closeMore = () => {
      if (!more || !moreBtn) return;
      more.classList.remove("is-open");
      moreBtn.setAttribute("aria-expanded", "false");
    };

    const resetItems = () => {
      if (!list || !more || !moreMenu) return;
      items.forEach((item) => list.insertBefore(item, more));
      moreMenu.replaceChildren();
      more.hidden = true;
      moreBtn?.classList.remove("is-active");
      closeMore();
    };

    const layoutNav = () => {
      if (!list || !more || !moreMenu || !moreBtn) return;
      resetItems();
      if (mobileQuery.matches) return;

      const available = overflowNav.clientWidth;
      const gap = parseFloat(getComputedStyle(list).columnGap || getComputedStyle(list).gap) || 0;
      const widths = items.map((item) => item.offsetWidth);
      let used = widths.reduce((sum, width, index) => sum + width + (index ? gap : 0), 0);

      if (used <= available) return;

      more.hidden = false;
      const moreWidth = more.offsetWidth + gap;
      const overflow = [];

      for (let i = items.length - 1; i >= 3 && used + moreWidth > available; i -= 1) {
        used -= widths[i] + gap;
        overflow.unshift(items[i]);
      }

      if (!overflow.length) {
        more.hidden = true;
        return;
      }

      overflow.forEach((item) => moreMenu.appendChild(item));
      if (overflow.some((item) => item.querySelector("a.is-active"))) {
        moreBtn.classList.add("is-active");
      }
    };

    const scheduleLayout = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layoutNav);
    };

    moreBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = moreBtn.getAttribute("aria-expanded") === "true";
      moreBtn.setAttribute("aria-expanded", String(!open));
      more?.classList.toggle("is-open", !open);
    });

    document.addEventListener("click", (event) => {
      if (more && !more.contains(event.target)) closeMore();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMore();
    });

    const headerInner = document.querySelector(".header-inner");
    if (typeof ResizeObserver === "function" && headerInner) {
      new ResizeObserver(scheduleLayout).observe(headerInner);
    } else {
      window.addEventListener("resize", scheduleLayout);
    }

    mobileQuery.addEventListener("change", scheduleLayout);
    if (document.fonts?.ready) document.fonts.ready.then(scheduleLayout);
    scheduleLayout();
  }

  if (header) {
    const onScroll = () => {
      header.style.boxShadow = window.scrollY > 8
        ? "0 8px 24px rgba(3, 16, 34, 0.25)"
        : "none";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const setPosition = (slider, percent) => {
    const clamped = Math.min(100, Math.max(0, percent));
    const before = slider.querySelector(".ba-before-wrap");
    const handle = slider.querySelector(".ba-handle");
    const beforeImg = slider.querySelector(".ba-before");
    const frame = slider.querySelector(".ba-frame");
    if (!before || !handle || !beforeImg || !frame) return;

    const frameWidth = frame.getBoundingClientRect().width;
    before.style.width = `${clamped}%`;
    handle.style.left = `${clamped}%`;
    handle.setAttribute("aria-valuenow", String(Math.round(clamped)));
    beforeImg.style.width = `${frameWidth}px`;
  };

  document.querySelectorAll("[data-ba]").forEach((slider) => {
    const frame = slider.querySelector(".ba-frame");
    const handle = slider.querySelector(".ba-handle");
    if (!frame || !handle) return;

    let dragging = false;

    const updateFromEvent = (clientX) => {
      const rect = frame.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      setPosition(slider, percent);
    };

    frame.addEventListener("pointerdown", (e) => {
      frame.setPointerCapture(e.pointerId);
      dragging = true;
      updateFromEvent(e.clientX);
    });
    frame.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      updateFromEvent(e.clientX);
    });
    frame.addEventListener("pointerup", () => {
      dragging = false;
    });
    frame.addEventListener("pointercancel", () => {
      dragging = false;
    });

    handle.addEventListener("keydown", (e) => {
      const current = Number(handle.getAttribute("aria-valuenow") || "50");
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPosition(slider, current - 3);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPosition(slider, current + 3);
      }
    });

    const sync = () => setPosition(slider, Number(handle.getAttribute("aria-valuenow") || "50"));
    if (document.readyState === "complete") sync();
    else window.addEventListener("load", sync);
    window.addEventListener("resize", sync);
  });

  /* Minimal section / card reveals */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const markReveal = (el, variant = "", delay = 0) => {
    if (!el || el.classList.contains("reveal")) return;
    el.classList.add("reveal");
    if (variant) el.classList.add(variant);
    if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
  };

  if (!prefersReduced) {
    markReveal(document.querySelector(".hero-copy"));
    markReveal(document.querySelector(".review-card"), "reveal-scale", 120);

    document.querySelectorAll(".trust-item").forEach((el, i) => {
      markReveal(el, "reveal-scale", i * 70);
    });

    document.querySelectorAll(".section-head, .services-extra").forEach((el) => {
      markReveal(el);
    });

    document.querySelectorAll(".service-card").forEach((el, i) => {
      markReveal(el, "reveal-scale", (i % 3) * 80);
    });

    markReveal(document.querySelector(".why-copy"), "reveal-left");

    document.querySelectorAll(".review-tile").forEach((el, i) => {
      markReveal(el, "reveal-scale", (i % 2) * 90);
    });

    markReveal(document.querySelector(".cta-inner"));
    document.querySelectorAll(".cta-perks li").forEach((el, i) => {
      markReveal(el, "", 80 + i * 70);
    });

    markReveal(document.querySelector(".location-intro"), "reveal-left");
    document.querySelectorAll(".location-details > *").forEach((el, i) => {
      markReveal(el, "reveal-right", i * 90);
    });

    markReveal(document.querySelector(".footer-brand"), "reveal-left");
    document.querySelectorAll(".footer-cols > *").forEach((el, i) => {
      markReveal(el, "", 60 + i * 70);
    });

    document.querySelectorAll(".page-hero .container > *:not(.breadcrumbs)").forEach((el, i) => {
      markReveal(el, "", i * 60);
    });
    document.querySelectorAll(".service-detail, .blog-card, .gallery-item, .split-copy, .split-media, .contact-form, .contact-aside > *").forEach((el, i) => {
      markReveal(el, "reveal-scale", Math.min(i, 6) * 60);
    });
    document.querySelectorAll(".prose > *").forEach((el, i) => {
      markReveal(el, "", Math.min(i, 8) * 40);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }
})();
