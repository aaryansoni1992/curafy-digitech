/**
 * Curafy Digitech - Main Application & Animation Controller
 * Handles mobile navbar, stats counter animations, scroll transitions,
 * and mouse glow tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    }

    // Close mobile menu when clicking any link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
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
});
