/**
 * Curafy Digitech - Interactive UI & Modals Controller
 * Handles modals, direct communication, case studies filtering,
 * FAQ accordions, and pricing switches.
 */

// Global Modal Helpers
window.openModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  const content = modal.querySelector('.modal-box');
  if (content) {
    content.classList.add('modal-enter-active');
  }
};

window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
};

window.openServiceModal = function (serviceValue, ctaGoal) {
  const modal = document.getElementById('consultation-modal');
  const serviceSelect = document.getElementById('modal-service');
  const goalInput = document.getElementById('modal-notes');

  if (serviceSelect && serviceValue) {
    serviceSelect.value = serviceValue;
  }
  if (goalInput && ctaGoal) {
    goalInput.value = `Selected Service Interest: ${serviceValue} (${ctaGoal})`;
  }
  window.openModal('consultation-modal');
};

window.openSectorModal = function (sectorValue, ctaGoal) {
  const modal = document.getElementById('consultation-modal');
  const industrySelect = document.getElementById('modal-industry');
  const goalInput = document.getElementById('modal-notes');

  if (industrySelect && sectorValue) {
    let matched = false;
    for (let opt of industrySelect.options) {
      if (opt.value.toLowerCase() === sectorValue.toLowerCase() || 
          opt.textContent.toLowerCase().includes(sectorValue.toLowerCase())) {
        industrySelect.value = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched) {
      industrySelect.value = sectorValue;
    }
  }
  if (goalInput) {
    goalInput.value = `Sector Blueprint: ${sectorValue} | Objective: ${ctaGoal || 'Accelerate Revenue & Customer Inquiries'}`;
  }
  window.openModal('consultation-modal');
};

// Online Growth Enquiry Selection & Smooth Navigation
window.selectSectorForEnquiry = function (sectorValue) {
  const sectorSelect = document.getElementById('enquiry-sector');
  if (sectorSelect && sectorValue) {
    let matched = false;
    for (let opt of sectorSelect.options) {
      if (opt.value.toLowerCase() === sectorValue.toLowerCase() || 
          opt.textContent.toLowerCase().includes(sectorValue.toLowerCase())) {
        sectorSelect.value = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched) {
      sectorSelect.value = sectorValue;
    }
  }

  const enquirySection = document.getElementById('enquiry');
  if (enquirySection) {
    enquirySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const form = document.getElementById('home-enquiry-form');
  if (form) {
    form.classList.add('ring-2', 'ring-cyan-400', 'transition-all');
    const firstInput = form.querySelector('input[name="name"]');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 600);
    }
    setTimeout(() => {
      form.classList.remove('ring-2', 'ring-cyan-400');
    }, 2800);
  }
};

window.selectServiceForEnquiry = function (serviceValue) {
  const serviceSelect = document.getElementById('enquiry-service');
  if (serviceSelect && serviceValue) {
    let matched = false;
    for (let opt of serviceSelect.options) {
      if (opt.value.toLowerCase() === serviceValue.toLowerCase() || 
          opt.textContent.toLowerCase().includes(serviceValue.toLowerCase())) {
        serviceSelect.value = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched) {
      serviceSelect.value = serviceValue;
    }
  }

  const enquirySection = document.getElementById('enquiry');
  if (enquirySection) {
    enquirySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const form = document.getElementById('home-enquiry-form');
  if (form) {
    form.classList.add('ring-2', 'ring-cyan-400', 'transition-all');
    const firstInput = form.querySelector('input[name="name"]');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 600);
    }
    setTimeout(() => {
      form.classList.remove('ring-2', 'ring-cyan-400');
    }, 2800);
  }
};

// Global Toast Notification Helper
window.showToast = function (message, type = 'success') {
  const toast = document.getElementById('notification-toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 4500);
};

// Direct Phone Call & Consultation Helpers (Official No: +91 63765 66383)
window.openDirectCall = function () {
  window.location.href = 'tel:+916376566383';
};

window.sendEnquiryToWhatsApp = function (formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const phone = form.querySelector('[name="phone"]')?.value || form.querySelector('input[type="tel"]')?.value || '';

  if (!phone || phone.trim() === '' || phone === 'Not provided') {
    window.showToast('Please enter your phone / mobile number before submitting.', 'error');
    const phoneInput = form.querySelector('[name="phone"]');
    if (phoneInput) phoneInput.focus();
    return false;
  }

  window.showToast('🚀 Consultation inquiry received! Our growth team will contact you shortly.', 'success');
  return true;
};

document.addEventListener('DOMContentLoaded', () => {

  // 2. Modal Close Buttons (Data attribute & Backdrop click)
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        window.closeModal(modal.id);
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.closeModal(modal.id);
      }
    });
  });

  // ESC key closes any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
        window.closeModal(modal.id);
      });
    }
  });

  // 3. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');

    if (trigger && answer) {
      trigger.addEventListener('click', () => {
        const isOpen = !answer.classList.contains('hidden');
        
        // Close other FAQs
        faqItems.forEach(otherItem => {
          const otherAns = otherItem.querySelector('.faq-answer');
          const otherIcon = otherItem.querySelector('.faq-icon');
          if (otherAns && otherAns !== answer) {
            otherAns.classList.add('hidden');
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
          }
        });

        // Toggle clicked FAQ
        if (isOpen) {
          answer.classList.add('hidden');
          if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
          answer.classList.remove('hidden');
          if (icon) icon.style.transform = 'rotate(180deg)';
        }
      });
    }
  });

  // 4. Portfolio / Case Studies Category Filtering
  const filterBtns = document.querySelectorAll('.portfolio-filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Set active button style
      filterBtns.forEach(b => {
        b.classList.remove('bg-gradient-to-r', 'from-cyan-500', 'to-blue-600', 'text-white');
        b.classList.add('text-slate-400', 'bg-slate-800/60');
      });
      btn.classList.remove('text-slate-400', 'bg-slate-800/60');
      btn.classList.add('bg-gradient-to-r', 'from-cyan-500', 'to-blue-600', 'text-white');

      const category = btn.getAttribute('data-category');

      portfolioCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'block';
          card.classList.add('animate-fadeIn');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 5. Pricing Plan Switcher (Monthly vs Quarterly discount)
  const pricingToggle = document.getElementById('pricing-toggle');
  if (pricingToggle) {
    const starterPrice = document.getElementById('price-starter');
    const scalePrice = document.getElementById('price-scale');
    const enterprisePrice = document.getElementById('price-enterprise');
    const periodLabels = document.querySelectorAll('.price-period');

    pricingToggle.addEventListener('change', () => {
      const isQuarterly = pricingToggle.checked;

      if (isQuarterly) {
        if (starterPrice) starterPrice.textContent = '₹21,250'; // 15% off standard 25,000
        if (scalePrice) scalePrice.textContent = '₹46,750'; // 15% off 55,000
        if (enterprisePrice) enterprisePrice.textContent = '₹93,500'; // 15% off 1,10,000
        periodLabels.forEach(p => p.textContent = '/month (billed quarterly)');
      } else {
        if (starterPrice) starterPrice.textContent = '₹25,000';
        if (scalePrice) scalePrice.textContent = '₹55,000';
        if (enterprisePrice) enterprisePrice.textContent = '₹1,10,000';
        periodLabels.forEach(p => p.textContent = '/month');
      }
    });
  }

  // 6. Interactive Lead Capture Forms (Consultation Modal, Audit Modal, Contact Form)
  const leadForms = document.querySelectorAll('form[data-lead-form]');
  leadForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const phoneInput = form.querySelector('[name="phone"]');
      if (phoneInput && (!phoneInput.value || phoneInput.value.trim() === '')) {
        window.showToast('Please enter your phone / mobile number before submitting.', 'error');
        phoneInput.focus();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg> Submitting Request...
        `;
      }

      // Simulate submission feedback
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }

        const modal = form.closest('.modal-overlay');
        if (modal) {
          window.closeModal(modal.id);
        }

        form.reset();
        window.showToast('🚀 Consultation inquiry received! Our growth team will contact you shortly.', 'success');
      }, 1000);
    });
  });

  // 7. Engineered For Your Exact Sector Portal Filter & Search
  const sectorSearchInput = document.getElementById('sector-search-input');
  const sectorSearchClear = document.getElementById('sector-search-clear');
  const sectorFilterBtns = document.querySelectorAll('.sector-filter-btn');
  const sectorCards = document.querySelectorAll('.sector-card');
  const sectorEmptyState = document.getElementById('sector-empty-state');
  const sectorCountDisplay = document.getElementById('sector-count-display');

  function filterSectors() {
    const query = sectorSearchInput ? sectorSearchInput.value.trim().toLowerCase() : '';
    let activeFilter = 'all';
    const activeBtn = document.querySelector('.sector-filter-btn.active-sector');
    if (activeBtn) {
      activeFilter = activeBtn.getAttribute('data-filter') || 'all';
    }

    let visibleCount = 0;

    sectorCards.forEach(card => {
      const cardSector = card.getAttribute('data-sector') || '';
      const cardTitle = card.getAttribute('data-sector-title') || '';
      const cardCategory = card.getAttribute('data-sector-category') || '';
      const cardText = card.textContent.toLowerCase();

      const matchesFilter = (activeFilter === 'all' || cardSector === activeFilter);
      const matchesSearch = !query || cardText.includes(query) || cardTitle.toLowerCase().includes(query) || cardCategory.toLowerCase().includes(query);

      if (matchesFilter && matchesSearch) {
        card.style.display = '';
        card.classList.add('animate-fadeIn');
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (sectorEmptyState) {
      if (visibleCount === 0) {
        sectorEmptyState.classList.remove('hidden');
      } else {
        sectorEmptyState.classList.add('hidden');
      }
    }

    if (sectorCountDisplay) {
      sectorCountDisplay.textContent = `${visibleCount} Sector${visibleCount === 1 ? '' : 's'} Displayed`;
    }
  }

  if (sectorFilterBtns.length > 0) {
    sectorFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sectorFilterBtns.forEach(b => {
          b.classList.remove('active-sector', 'bg-gradient-to-r', 'from-cyan-500', 'to-blue-600', 'text-white', 'border-cyan-400', 'shadow-md', 'shadow-cyan-500/20');
          b.classList.add('text-slate-400', 'bg-slate-900/80', 'border-slate-800');
        });
        btn.classList.remove('text-slate-400', 'bg-slate-900/80', 'border-slate-800');
        btn.classList.add('active-sector', 'bg-gradient-to-r', 'from-cyan-500', 'to-blue-600', 'text-white', 'border-cyan-400', 'shadow-md', 'shadow-cyan-500/20');

        filterSectors();
      });
    });
  }

  if (sectorSearchInput) {
    sectorSearchInput.addEventListener('input', () => {
      if (sectorSearchClear) {
        if (sectorSearchInput.value) {
          sectorSearchClear.classList.remove('hidden');
        } else {
          sectorSearchClear.classList.add('hidden');
        }
      }
      filterSectors();
    });
  }

  if (sectorSearchClear) {
    sectorSearchClear.addEventListener('click', () => {
      if (sectorSearchInput) {
        sectorSearchInput.value = '';
        sectorSearchClear.classList.add('hidden');
        filterSectors();
      }
    });
  }

  // Helper for menu item selection to trigger sector filter and smooth scroll
  window.selectSectorFromMenu = function(filterName) {
    if (sectorSearchInput) {
      sectorSearchInput.value = '';
      if (sectorSearchClear) sectorSearchClear.classList.add('hidden');
    }

    const btn = document.querySelector(`.sector-filter-btn[data-filter="${filterName}"]`);
    if (btn) {
      btn.click();
    } else {
      filterSectors();
    }

    const industriesSection = document.getElementById('industries');
    if (industriesSection) {
      industriesSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
    }
  };
});
