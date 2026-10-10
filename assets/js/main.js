/**
 * Curafy Digitech - Main Application & Animation Controller
 * Handles mobile navbar, stats counter animations, scroll transitions,
 * and mouse glow tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle with Body Scroll Lock
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('hidden');
    if (mobileMenuBackdrop) mobileMenuBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('hidden');
    if (mobileMenuBackdrop) mobileMenuBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        openMobileMenu();
      } else {
        closeMobileMenu();
      }
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileMenuBackdrop) {
      mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
    }

    // Close mobile menu when clicking any link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Mobile services submenu toggle
    const mobileServicesToggle = document.getElementById('mobile-services-toggle');
    const mobileServicesList = document.getElementById('mobile-services-list');
    const mobileServicesIcon = document.getElementById('mobile-services-icon');

    if (mobileServicesToggle && mobileServicesList) {
      mobileServicesToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = !mobileServicesList.classList.contains('hidden');
        if (isOpen) {
          mobileServicesList.classList.add('hidden');
          if (mobileServicesIcon) mobileServicesIcon.style.transform = 'rotate(0deg)';
        } else {
          mobileServicesList.classList.remove('hidden');
          if (mobileServicesIcon) mobileServicesIcon.style.transform = 'rotate(180deg)';
        }
      });
    }

    // Mobile industries submenu toggle
    const mobileIndustriesToggle = document.getElementById('mobile-industries-toggle');
    const mobileIndustriesList = document.getElementById('mobile-industries-list');
    const mobileIndustriesIcon = document.getElementById('mobile-industries-icon');

    if (mobileIndustriesToggle && mobileIndustriesList) {
      mobileIndustriesToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = !mobileIndustriesList.classList.contains('hidden');
        if (isOpen) {
          mobileIndustriesList.classList.add('hidden');
          if (mobileIndustriesIcon) mobileIndustriesIcon.style.transform = 'rotate(0deg)';
        } else {
          mobileIndustriesList.classList.remove('hidden');
          if (mobileIndustriesIcon) mobileIndustriesIcon.style.transform = 'rotate(180deg)';
        }
      });
    }
  }

  // 2. Sticky Navbar Glass Effect on Scroll
  const mainHeader = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      mainHeader.classList.add('header-glass', 'py-3.5');
      mainHeader.classList.remove('py-5');
    } else {
      mainHeader.classList.remove('header-glass', 'py-3.5');
      mainHeader.classList.add('py-5');
    }
  });

  // 3. Stats Counter Animation using IntersectionObserver
  const statsSection = document.getElementById('stats-section');
  let hasAnimatedStats = false;

  function animateCount(element, target, duration = 1800, prefix = '', suffix = '') {
    let start = 0;
    const isFloat = target % 1 !== 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * ease;

      element.textContent = `${prefix}${isFloat ? current.toFixed(1) : Math.floor(current)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = `${prefix}${target}${suffix}`;
      }
    }
    requestAnimationFrame(update);
  }

  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimatedStats) {
          hasAnimatedStats = true;
          
          const statProjects = document.getElementById('stat-projects');
          const statRoi = document.getElementById('stat-roi');
          const statSpend = document.getElementById('stat-spend');
          const statRetention = document.getElementById('stat-retention');

          if (statProjects) animateCount(statProjects, 250, 1800, '', '+');
          if (statRoi) animateCount(statRoi, 3.8, 1600, '', 'x');
          if (statSpend) animateCount(statSpend, 12, 1700, '₹', 'Cr+');
          if (statRetention) animateCount(statRetention, 99.2, 1900, '', '%');
        }
      });
    }, { threshold: 0.25 });

    observer.observe(statsSection);
  }

  // 4. Cursor Ambient Glow Follower for high-tech desktop feel
  const glowFollower = document.getElementById('ambient-cursor-glow');
  if (glowFollower && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderGlow() {
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;
      glowFollower.style.transform = `translate(${currentX - 250}px, ${currentY - 250}px)`;
      requestAnimationFrame(renderGlow);
    }
    requestAnimationFrame(renderGlow);
  }

  // 5. Transparent 3D Digital Speedometer Controller
  const meterCard = document.getElementById('hero-3d-meter-card');
  const meterNeedle = document.getElementById('meter-needle-group');
  const meterValueEl = document.getElementById('hero-meter-val');

  if (meterCard) {
    // Interactive 3D Parallax Tilt on Mouse Move
    const heroVisualArea = meterCard.closest('.lg\\:col-span-5') || meterCard.parentElement;

    if (heroVisualArea && window.matchMedia('(pointer: fine)').matches) {
      heroVisualArea.addEventListener('mousemove', (e) => {
        const rect = heroVisualArea.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const rotateX = -(y / rect.height) * 16;
        const rotateY = (x / rect.width) * 18;

        meterCard.classList.remove('meter-floating-idle');
        meterCard.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(10px)`;
      });

      heroVisualArea.addEventListener('mouseleave', () => {
        meterCard.style.transform = '';
        meterCard.classList.add('meter-floating-idle');
      });
    }

    // Trigger Initial Needle Sweep & Counter Animation
    setTimeout(() => {
      if (meterNeedle) {
        // Sweep needle from -90deg up to 74deg
        meterNeedle.style.transform = 'rotate(74deg)';
        
        // After sweep completes (2s), activate subtle engine throttle idle vibration
        setTimeout(() => {
          meterNeedle.classList.add('needle-throttling');
        }, 2000);
      }

      if (meterValueEl) {
        let current = 0;
        const target = 94.8;
        const duration = 1900;
        const start = performance.now();

        function countUp(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          current = ease * target;
          meterValueEl.textContent = current.toFixed(1);

          if (progress < 1) {
            requestAnimationFrame(countUp);
          } else {
            meterValueEl.textContent = '94.8';
          }
        }
        requestAnimationFrame(countUp);
      }
    }, 400);
  }
});
