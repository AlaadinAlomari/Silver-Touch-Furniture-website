/**
 * Silver Touch Qatar — Main JavaScript
 * Pure Vanilla JS, no dependencies
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════
     1. NAVIGATION — SCROLL BEHAVIOR
  ══════════════════════════════════════════ */
  const navbar  = document.getElementById('navbar');
  const navCont = navbar ? navbar.querySelector('.nav-container') : null;
  const SCROLL_THRESHOLD      = 80;
  const SCROLL_DEEP_THRESHOLD = 300;

  function handleNavScroll() {
    if (!navbar || navbar.classList.contains('nav-static')) return;
    const y = window.scrollY;

    /* Glass pill on / off */
    navbar.classList.toggle('scrolled',      y > SCROLL_THRESHOLD);
    /* Deeper blur tier */
    navbar.classList.toggle('scrolled-deep', y > SCROLL_DEEP_THRESHOLD);
  }

  if (navbar) {
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();
  }


  /* ══════════════════════════════════════════
     2. ACTIVE NAV LINK — URL-BASED
  ══════════════════════════════════════════ */
  function setActiveNavLink() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.classList.remove('active');
      const href = (link.getAttribute('href') || '').split('/').pop();
      if (!href) return;
      if (href === filename) {
        link.classList.add('active');
      }
      // Highlight "Services" for any services/* sub-page
      if (path.includes('/services/') && href === 'services.html') {
        link.classList.add('active');
      }
    });
  }

  setActiveNavLink();


  /* ══════════════════════════════════════════
     3. SCROLL SPY (single-page sections only)
  ══════════════════════════════════════════ */
  const sections = document.querySelectorAll('section[id]');

  if (sections.length > 0) {
    function updateActiveLink() {
      const scrollY = window.scrollY + 120;
      let currentSection = '';
      sections.forEach(function (section) {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          currentSection = section.getAttribute('id');
        }
      });
      if (currentSection) {
        document.querySelectorAll('.nav-link[href^="#"]').forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + currentSection) {
            link.classList.add('active');
          }
        });
      }
    }
    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();
  }


  /* ══════════════════════════════════════════
     4. HAMBURGER MENU
  ══════════════════════════════════════════ */
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('navLinks');

  if (hamburger && navLinksContainer) {

    function closeMenu() {
      navLinksContainer.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (navCont) navCont.classList.remove('menu-open');
    }

    hamburger.addEventListener('click', function () {
      const isOpen = navLinksContainer.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
      /* Flatten pill bottom corners so menu attaches seamlessly */
      if (navCont) navCont.classList.toggle('menu-open', isOpen);
    });

    // Mobile: toggle service dropdown on click
    document.querySelectorAll('.has-dropdown').forEach(function (item) {
      const link = item.querySelector('.nav-link');
      if (!link) return;
      link.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          item.classList.toggle('open');
        }
      });
    });

    // Close on nav link click
    navLinksContainer.querySelectorAll('a:not(.has-dropdown > .nav-link)').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navLinksContainer.contains(e.target) && navLinksContainer.classList.contains('open')) {
        closeMenu();
      }
    });
  }


  /* ══════════════════════════════════════════
     5. INTERSECTION OBSERVER — FADE-UP
  ══════════════════════════════════════════ */
  const fadeElements = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window && fadeElements.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -60px 0px', threshold: 0.07 });

    fadeElements.forEach(function (el) { observer.observe(el); });
  } else {
    fadeElements.forEach(function (el) { el.classList.add('visible'); });
  }


  /* ══════════════════════════════════════════
     6. CONTACT FORM — SUBMISSION HANDLER
  ══════════════════════════════════════════ */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const fullName = contactForm.querySelector('#fullName');
      const email    = contactForm.querySelector('#email');
      const submitBtn = contactForm.querySelector('[type="submit"]');

      clearErrors(contactForm);

      let valid = true;
      if (!fullName || !fullName.value.trim()) {
        if (fullName) showError(fullName, 'Please enter your full name.');
        valid = false;
      }
      if (!email || !email.value.trim() || !isValidEmail(email.value.trim())) {
        if (email) showError(email, 'Please enter a valid email address.');
        valid = false;
      }
      if (!valid) return;

      const originalHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Sending…</span>';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.75';

      const phoneField = contactForm.querySelector('#phone');
      const serviceField = contactForm.querySelector('#service');
      const messageField = contactForm.querySelector('#message');

      const payload = {
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        phone: phoneField ? phoneField.value.trim() : '',
        service: serviceField ? serviceField.value : '',
        message: messageField ? messageField.value.trim() : '',
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
          submitBtn.style.opacity = '';
          if (result.ok) {
            showSuccessMessage(contactForm);
            contactForm.reset();
          } else {
            showErrorMessage(contactForm, result.data.error || 'Something went wrong. Please try again.');
          }
        })
        .catch(function () {
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
          submitBtn.style.opacity = '';
          showErrorMessage(contactForm, 'Something went wrong. Please try again or contact us directly.');
        });
    });
  }

  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  function showError(input, message) {
    input.style.borderColor = '#C0392B';
    const err = document.createElement('span');
    err.className = 'form-error';
    err.textContent = message;
    err.style.cssText = 'font-size:0.75rem;color:#C0392B;margin-top:0.25rem;display:block;';
    input.parentNode.appendChild(err);
  }

  function clearErrors(form) {
    form.querySelectorAll('.form-error').forEach(function (el) { el.remove(); });
    form.querySelectorAll('input, select, textarea').forEach(function (el) { el.style.borderColor = ''; });
  }

  function showSuccessMessage(form) {
    const existing = document.querySelector('.form-success-msg, .form-error-msg');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = 'form-success-msg';
    msg.setAttribute('role', 'alert');
    msg.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" style="flex-shrink:0"><circle cx="10" cy="10" r="9" stroke="#B8952A" stroke-width="1.5"/><path d="M6 10 L9 13 L14 7" stroke="#B8952A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Thank you! We will contact you shortly.</span>';
    msg.style.cssText = 'display:flex;align-items:center;gap:0.75rem;background:rgba(184,149,42,0.08);border:1px solid rgba(184,149,42,0.3);color:#1A1A1A;padding:1rem 1.25rem;font-size:0.875rem;font-weight:500;margin-top:0.5rem;opacity:0;transition:opacity 0.4s ease;';

    form.parentNode.appendChild(msg);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { msg.style.opacity = '1'; });
    });
    setTimeout(function () {
      msg.style.opacity = '0';
      setTimeout(function () { msg.remove(); }, 400);
    }, 6000);
  }

  function showErrorMessage(form, text) {
    const existing = document.querySelector('.form-success-msg, .form-error-msg');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = 'form-error-msg';
    msg.setAttribute('role', 'alert');
    msg.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" style="flex-shrink:0"><circle cx="10" cy="10" r="9" stroke="#C0392B" stroke-width="1.5"/><path d="M10 6v5M10 14h.01" stroke="#C0392B" stroke-width="1.5" stroke-linecap="round"/></svg><span>' + text + '</span>';
    msg.style.cssText = 'display:flex;align-items:center;gap:0.75rem;background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.3);color:#1A1A1A;padding:1rem 1.25rem;font-size:0.875rem;font-weight:500;margin-top:0.5rem;opacity:0;transition:opacity 0.4s ease;';

    form.parentNode.appendChild(msg);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { msg.style.opacity = '1'; });
    });
    setTimeout(function () {
      msg.style.opacity = '0';
      setTimeout(function () { msg.remove(); }, 400);
    }, 6000);
  }


  /* ══════════════════════════════════════════
     7. SMOOTH SCROLL — ANCHOR LINKS
  ══════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').replace('#', '');
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });


  /* ══════════════════════════════════════════
     8. PROCESS STEPS — HOVER
  ══════════════════════════════════════════ */
  document.querySelectorAll('.process-step').forEach(function (step) {
    step.addEventListener('mouseenter', function () {
      const icon = this.querySelector('.step-icon');
      if (icon && !this.classList.contains('active') && !this.classList.contains('completed')) {
        icon.style.borderColor = 'var(--color-gold)';
        icon.style.color = 'var(--color-gold)';
      }
    });
    step.addEventListener('mouseleave', function () {
      const icon = this.querySelector('.step-icon');
      if (icon && !this.classList.contains('active') && !this.classList.contains('completed')) {
        icon.style.borderColor = '';
        icon.style.color = '';
      }
    });
  });


  /* ══════════════════════════════════════════
     9. MATERIALS DOTS — CYCLE
  ══════════════════════════════════════════ */
  const dots = document.querySelectorAll('.dot');
  if (dots.length > 0) {
    let current = 0;
    setInterval(function () {
      dots[current].classList.remove('dot-active');
      current = (current + 1) % dots.length;
      dots[current].classList.add('dot-active');
    }, 3000);
  }


  /* ══════════════════════════════════════════
     10. LOOKBOOK KEYBOARD ACCESSIBILITY
  ══════════════════════════════════════════ */
  document.querySelectorAll('.lookbook-item, .project-card').forEach(function (item) {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'figure');
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const overlay = this.querySelector('.project-overlay');
        if (overlay) {
          overlay.style.opacity = overlay.style.opacity === '1' ? '0' : '1';
        }
      }
    });
  });


  /* ══════════════════════════════════════════
     11. REDUCED MOTION
  ══════════════════════════════════════════ */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fadeElements.forEach(function (el) { el.style.transition = 'none'; el.classList.add('visible'); });
    const wa = document.querySelector('.whatsapp-float');
    if (wa) wa.style.animation = 'none';
    const sl = document.querySelector('.scroll-line');
    if (sl) sl.style.animation = 'none';
  }

}());
