/**
 * Curafy Digitech - Interactive Growth & ROI Calculator
 * Calculates estimated digital reach, qualified leads/patient bookings,
 * projected revenue growth, and ROI multiplier based on industry benchmarks.
 */

document.addEventListener('DOMContentLoaded', () => {
  const budgetInput = document.getElementById('calc-budget');
  const budgetDisplay = document.getElementById('calc-budget-display');
  const industrySelect = document.getElementById('calc-industry');
  const durationRadios = document.querySelectorAll('input[name="calc-duration"]');

  // Output Elements
  const outReach = document.getElementById('calc-out-reach');
  const outLeads = document.getElementById('calc-out-leads');
  const outRevenue = document.getElementById('calc-out-revenue');
  const outRoi = document.getElementById('calc-out-roi');
  const outLeadsLabel = document.getElementById('calc-leads-label');

  if (!budgetInput || !outReach) return;

  // Industry Benchmarks (Conversion rate %, Avg Value in INR, Cost per lead benchmark)
  const industryData = {
    healthcare: {
      cpc: 14,
      cvr: 0.085, // 8.5% conversion from clicks to patient inquiries
      avgValue: 3800, // Avg consultation & follow-up value
      roiMultiplier: 4.8,
      leadsLabel: 'Patient Appointments'
    },
    hospitality: {
      cpc: 12,
      cvr: 0.065,
      avgValue: 7500,
      roiMultiplier: 5.2,
      leadsLabel: 'Direct Room & Stay Bookings'
    },
    real_estate: {
      cpc: 28,
      cvr: 0.045,
      avgValue: 120000,
      roiMultiplier: 6.8,
      leadsLabel: 'Verified Site Visits & Buyers'
    },
    education: {
      cpc: 15,
      cvr: 0.070,
      avgValue: 24000,
      roiMultiplier: 5.5,
      leadsLabel: 'Student Inquiries & Admissions'
    },
    food_restaurants: {
      cpc: 7,
      cvr: 0.095,
      avgValue: 1400,
      roiMultiplier: 4.4,
      leadsLabel: 'Table Reservations & Orders'
    },
    automobile: {
      cpc: 22,
      cvr: 0.055,
      avgValue: 45000,
      roiMultiplier: 5.8,
      leadsLabel: 'Test Drive & Service Bookings'
    },
    beauty_wellness: {
      cpc: 9,
      cvr: 0.080,
      avgValue: 2600,
      roiMultiplier: 4.6,
      leadsLabel: 'Salon Appointments & Walk-ins'
    },
    fashion: {
      cpc: 8,
      cvr: 0.042,
      avgValue: 2200,
      roiMultiplier: 4.5,
      leadsLabel: 'D2C Orders & Wardrobe Consults'
    },
    jewellery: {
      cpc: 25,
      cvr: 0.040,
      avgValue: 75000,
      roiMultiplier: 6.0,
      leadsLabel: 'Showroom Visits & Bridal Orders'
    },
    professional_services: {
      cpc: 26,
      cvr: 0.050,
      avgValue: 35000,
      roiMultiplier: 5.6,
      leadsLabel: 'Consultation Calls & Retainers'
    },
    manufacturing: {
      cpc: 30,
      cvr: 0.038,
      avgValue: 95000,
      roiMultiplier: 6.5,
      leadsLabel: 'B2B RFQs & Bulk Export Deals'
    },
    ecommerce: {
      cpc: 8,
      cvr: 0.040,
      avgValue: 1950,
      roiMultiplier: 4.6,
      leadsLabel: 'Direct Online Checkout Purchases'
    },
    travel_tourism: {
      cpc: 13,
      cvr: 0.060,
      avgValue: 18000,
      roiMultiplier: 5.1,
      leadsLabel: 'Package Bookings & Travel Inquiries'
    },
    events_weddings: {
      cpc: 19,
      cvr: 0.052,
      avgValue: 55000,
      roiMultiplier: 5.9,
      leadsLabel: 'Event Inquiries & Date Bookings'
    },
    // Aliases for backwards compatibility
    local: {
      cpc: 9,
      cvr: 0.075,
      avgValue: 2200,
      roiMultiplier: 4.2,
      leadsLabel: 'Qualified Inquiries & Visits'
    },
    startup: {
      cpc: 18,
      cvr: 0.065,
      avgValue: 12500,
      roiMultiplier: 5.4,
      leadsLabel: 'Demo Requests & User Trials'
    },
    corporate: {
      cpc: 32,
      cvr: 0.045,
      avgValue: 65000,
      roiMultiplier: 6.2,
      leadsLabel: 'High-Value B2B Pipeline Leads'
    }
  };

  function formatCurrency(amount) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${Number(amount).toLocaleString('en-IN')}`;
    }
  }

  function calculateGrowth() {
    const monthlyBudget = parseFloat(budgetInput.value) || 30000;
    const selectedIndustryKey = industrySelect ? industrySelect.value : 'healthcare';
    const industry = industryData[selectedIndustryKey] || industryData.healthcare;

    // Get duration multiplier (months)
    let months = 6;
    durationRadios.forEach(radio => {
      if (radio.checked) months = parseInt(radio.value, 10);
    });

    // Update Slider Display
    if (budgetDisplay) {
      budgetDisplay.textContent = formatCurrency(monthlyBudget);
    }

    // Dynamic Calculations
    const totalBudget = monthlyBudget * months;
    const totalClicks = Math.round(totalBudget / industry.cpc);
    const estimatedReach = Math.round(totalClicks * 16.5); // Organic + Paid impressions ratio
    const qualifiedLeads = Math.round(totalClicks * industry.cvr);
    
    // Scale revenue based on industry ROI benchmarks with realistic growth curve
    const baseRevenue = qualifiedLeads * (industry.avgValue * 0.45); // Assuming 45% close rate on qualified leads
    const roiMultiplierValue = (baseRevenue / totalBudget).toFixed(1);
    const finalRoi = Math.max(3.2, parseFloat(roiMultiplierValue)).toFixed(1);
    const estimatedExtraRevenue = Math.round(totalBudget * finalRoi);

    // Update UI with smooth numbers
    outReach.textContent = Number(estimatedReach).toLocaleString('en-IN');
    outLeads.textContent = Number(qualifiedLeads).toLocaleString('en-IN');
    outRevenue.textContent = formatCurrency(estimatedExtraRevenue);
    outRoi.textContent = `${finalRoi}x`;

    if (outLeadsLabel) {
      outLeadsLabel.textContent = industry.leadsLabel;
    }
  }

  // Event Listeners
  budgetInput.addEventListener('input', calculateGrowth);
  if (industrySelect) {
    industrySelect.addEventListener('change', calculateGrowth);
  }
  durationRadios.forEach(radio => {
    radio.addEventListener('change', calculateGrowth);
  });

  // Action button: Pre-fill Consultation Modal with user's inputs
  const applyCalcBtn = document.getElementById('apply-calc-btn');
  if (applyCalcBtn) {
    applyCalcBtn.addEventListener('click', () => {
      const modal = document.getElementById('consultation-modal');
      const serviceSelect = document.getElementById('modal-service');
      const budgetField = document.getElementById('modal-notes');

      const industryField = document.getElementById('modal-industry');
      if (industryField && industrySelect) {
        industryField.value = industrySelect.value;
      }
      if (serviceSelect) {
        serviceSelect.value = 'Performance Marketing';
      }
      if (budgetField) {
        budgetField.value = `Calculated Target Budget: ${formatCurrency(budgetInput.value)}/mo | Projected ROI: ${outRoi.textContent}`;
      }

      if (window.openModal) {
        window.openModal('consultation-modal');
      }
    });
  }

  // Initial calculation on load
  calculateGrowth();
});
