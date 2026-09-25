/**
 * Curafy Digitech - Mitra AI Messenger Engine
 * Intelligent Virtual Growth & Career Advisor
 * Position: Bottom-Left Floating Widget
 */

(function () {
  'use strict';

  // State Management
  const STATE = {
    isOpen: false,
    soundEnabled: true,
    isTyping: false,
    history: [],
    mode: 'general', // 'general' | 'business' | 'career' | 'lead_capture'
    leadData: { name: '', contact: '', topic: '' }
  };

  const TARGET_EMAIL = 'info@curafydigitech.com';
  const CC_EMAIL = 'sonu@curafydigitech.com';

  // Comprehensive Knowledge Base
  const KNOWLEDGE = {
    careers: {
      openRoles: [
        { title: 'Performance Marketer (Meta/Google Ads)', type: 'Full-time / Hybrid', exp: '1–4 Yrs' },
        { title: 'SEO & Organic Growth Specialist', type: 'Full-time', exp: '1–3 Yrs' },
        { title: 'Full-Stack Web & Landing Page Developer', type: 'Full-time / Remote', exp: '2–4 Yrs' },
        { title: 'Client Growth & Healthcare Strategist', type: 'Full-time', exp: '2–5 Yrs' },
        { title: 'Graphic Designer & Video Creator', type: 'Full-time / Hybrid', exp: '1–3 Yrs' },
        { title: 'Digital Marketing Intern (Paid)', type: 'Internship (3–6 Mo)', exp: 'Fresher' }
      ],
      perks: ['Competitive CTC + High Performance Incentives', 'Hybrid & Flexible Work Model', 'Direct Mentorship by Growth Directors', 'Work on High-Scale National & Healthcare Brands']
    },
    business: {
      services: [
        { name: 'Performance Marketing', desc: 'High-ROI Meta & Google Ad campaigns engineered for positive ROAS (Average 3.8x ROAS).' },
        { name: 'Healthcare & Clinic Acceleration', desc: 'Specialized patient acquisition funnels generating 120–250+ monthly OPD bookings.' },
        { name: 'SEO & Local Google Maps Domination', desc: 'Rank #1 on Google Local 3-Pack and capture high-intent local customer searches.' },
        { name: 'High-Converting Web & Landing Pages', desc: 'Fast, mobile-optimized, conversion-focused websites built to turn traffic into paying clients.' },
        { name: 'Social Media & Brand Scaling', desc: 'High-end viral video reels, aesthetic creatives, and authority brand positioning.' }
      ],
      packages: [
        { tier: 'Starter Growth', range: 'Under ₹25,000 / month', ideal: 'Local clinics, boutique shops & new startups' },
        { tier: 'Scale Acceleration', range: '₹25,000 – ₹75,000 / month', ideal: 'Growing hospitals, e-commerce & multi-location businesses' },
        { tier: 'Dominance & Enterprise', range: '₹1,00,000+ / month', ideal: 'Large healthcare networks, real estate & national brands' }
      ]
    }
  };

  // Quick Action Buttons
  const QUICK_CHIPS = [
    { label: '💼 Job Openings & Hiring', query: 'What career and job openings are available at Curafy Digitech?' },
    { label: '📈 Scale My Business', query: 'How can Curafy Digitech help grow my business and get more leads?' },
    { label: '🏥 Healthcare & Clinic Marketing', query: 'Tell me about patient acquisition for clinics and hospitals.' },
    { label: '💰 Pricing & Packages', query: 'What are your marketing pricing plans and packages?' },
    { label: '📋 Book Consultation', query: 'I want to book a 1-on-1 strategy consultation.' }
  ];

  // Initialize Mitra UI on DOM Ready
  function initMitra() {
    if (document.getElementById('mitra-ai-container')) return;

    const container = document.createElement('div');
    container.id = 'mitra-ai-container';
    container.innerHTML = `
      <!-- Floating AI Trigger Button (Bottom-Left) -->
      <div id="mitra-ai-trigger-wrap" class="fixed bottom-6 left-6 z-50 flex items-center gap-3">
        <!-- Floating Button -->
        <button id="mitra-ai-btn" type="button" aria-label="Open Mitra AI Messenger" class="mitra-btn relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-2xl hover:brightness-110 active:scale-95 transition-all duration-300">
          <!-- Pulse radar wave -->
          <span class="mitra-radar-ring"></span>
          
          <!-- Avatar Icon -->
          <div class="relative w-8 h-8 rounded-full bg-slate-950/80 border border-cyan-300/40 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8V4H8"></path>
              <rect width="16" height="12" x="4" y="8" rx="2"></rect>
              <path d="M2 14h2"></path>
              <path d="M20 14h2"></path>
              <path d="M15 13v2"></path>
              <path d="M9 13v2"></path>
            </svg>
            <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></span>
          </div>

          <!-- Label -->
          <div class="text-left pr-1">
            <span class="block text-xs font-extrabold tracking-wide uppercase leading-none font-heading text-white">Mitra AI</span>
            <span class="block text-[10px] text-cyan-100 font-medium leading-tight">Ask Business &amp; Jobs</span>
          </div>

          <!-- Unread indicator bubble -->
          <span id="mitra-badge" class="ml-0.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md">1</span>
        </button>

        <!-- Prompt Callout Tooltip (Auto dismissed) -->
        <div id="mitra-hint-bubble" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-slate-200 text-xs shadow-xl animate-bounce pointer-events-none">
          <span class="text-cyan-400 font-bold">✨ Ask Mitra</span>
          <span class="text-[11px] text-slate-300">Services &bull; Careers &bull; Instant Help</span>
        </div>
      </div>

      <!-- Mitra AI Messenger Box (Bottom-Left) -->
      <div id="mitra-ai-messenger" class="hidden fixed bottom-24 left-6 z-50 w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-120px)] flex-col rounded-3xl bg-slate-950/95 border border-cyan-500/50 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300">
        
        <!-- Header -->
        <div class="p-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950"></span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h4 class="text-sm font-bold text-white font-heading tracking-wide">Mitra AI</h4>
                <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-600/50">Curafy Bot</span>
              </div>
              <p class="text-[11px] text-emerald-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Online &bull; Business &amp; Career Guide</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button id="mitra-clear-btn" type="button" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors" title="Clear Chat History">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
            <button id="mitra-close-btn" type="button" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors" title="Close Messenger">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <!-- Notification Banner / Quick Routing Notice -->
        <div class="px-3.5 py-1.5 bg-cyan-950/40 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
          <span>⚡ Replies in seconds &bull; Direct email to <strong class="text-cyan-300 font-mono">info@curafydigitech.com</strong></span>
          <span class="text-cyan-400 font-semibold">24x7 Active</span>
        </div>

        <!-- Chat Stream -->
        <div id="mitra-chat-stream" class="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs text-slate-200">
          <!-- Messages will be injected here -->
        </div>

        <!-- Quick Prompt Chips Strip -->
        <div id="mitra-quick-chips" class="p-2 border-t border-slate-800 bg-slate-900/60 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 no-scrollbar shrink-0">
          <!-- Quick reply pills will be populated here -->
        </div>

        <!-- Input Area -->
        <form id="mitra-input-form" class="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <input 
            type="text" 
            id="mitra-user-input" 
            placeholder="Ask about business, services, or jobs..." 
            autocomplete="off"
            class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <button 
            type="submit" 
            id="mitra-send-btn" 
            aria-label="Send message"
            class="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20 shrink-0"
          >
            <svg class="w-4 h-4 rotate-45 -translate-y-0.5 translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>

      </div>
    `;

    document.body.appendChild(container);
    setupMitraEvents();
    loadInitialGreeting();

    // Hide hint bubble after 8 seconds
    setTimeout(() => {
      const hint = document.getElementById('mitra-hint-bubble');
      if (hint) hint.classList.add('hidden');
    }, 8000);
  }

  // Bind Event Listeners
  function setupMitraEvents() {
    const triggerBtn = document.getElementById('mitra-ai-btn');
    const closeBtn = document.getElementById('mitra-close-btn');
    const clearBtn = document.getElementById('mitra-clear-btn');
    const form = document.getElementById('mitra-input-form');
    const input = document.getElementById('mitra-user-input');

    if (triggerBtn) {
      triggerBtn.addEventListener('click', toggleMitra);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMitra);
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', clearChat);
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || STATE.isTyping) return;
        input.value = '';
        handleUserMessage(text);
      });
    }

    // Populate Initial Chips
    renderQuickChips(QUICK_CHIPS);
  }

  // Toggle Messenger Visibility
  function toggleMitra() {
    if (STATE.isOpen) {
      closeMitra();
    } else {
      openMitra();
    }
  }

  function openMitra() {
    const messenger = document.getElementById('mitra-ai-messenger');
    const badge = document.getElementById('mitra-badge');
    const input = document.getElementById('mitra-user-input');

    if (messenger) {
      messenger.classList.remove('hidden');
      messenger.classList.add('flex');
      STATE.isOpen = true;
      if (badge) badge.classList.add('hidden');
      if (input) setTimeout(() => input.focus(), 200);
      scrollChatToBottom();
    }
  }

  function closeMitra() {
    const messenger = document.getElementById('mitra-ai-messenger');
    if (messenger) {
      messenger.classList.add('hidden');
      messenger.classList.remove('flex');
      STATE.isOpen = false;
    }
  }

  function clearChat() {
    const stream = document.getElementById('mitra-chat-stream');
    if (stream) stream.innerHTML = '';
    STATE.history = [];
    try { sessionStorage.removeItem('curafy_mitra_chat'); } catch (_) {}
    loadInitialGreeting();
  }

  // Initial Welcome Greeting
  function loadInitialGreeting() {
    const welcomeHtml = `
      <div class="space-y-2">
        <p>Namaste! 🙏 I am <strong>Mitra</strong>, your AI Growth &amp; Career Assistant at <strong>Curafy Digitech</strong>.</p>
        <p class="text-slate-300">I can instantly assist you with:</p>
        <div class="grid grid-cols-1 gap-1.5 pl-1 my-2">
          <div class="flex items-center gap-1.5 text-[11px] text-cyan-300">
            <span>📈</span> <span><strong>Business Growth:</strong> Ads, SEO, Healthcare OPD Funnels &amp; ROI</span>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span>💼</span> <span><strong>Careers &amp; Hiring:</strong> Open Roles, Eligibility &amp; Job Application</span>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] text-amber-300">
            <span>⚡</span> <span><strong>Direct Routing:</strong> Queries sent to <em>info@curafydigitech.com</em></span>
          </div>
        </div>
        <p class="text-[11px] text-slate-400">Choose a topic below or type your question in English, Hindi, or Hinglish!</p>
      </div>
    `;
    appendBotMessage(welcomeHtml, [
      { label: '💼 Job Openings', query: 'What jobs are open?' },
      { label: '📈 Scale Business', query: 'How to scale my business?' },
      { label: '🏥 Clinic Marketing', query: 'Healthcare marketing details' },
      { label: '💰 Pricing Plans', query: 'What are your marketing packages?' }
    ]);
  }

  // Render Contextual Quick Chips
  function renderQuickChips(chips) {
    const container = document.getElementById('mitra-quick-chips');
    if (!container) return;

    container.innerHTML = '';
    chips.forEach(chip => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-all shrink-0';
      btn.textContent = chip.label;
      btn.onclick = () => {
        handleUserMessage(chip.query);
      };
      container.appendChild(btn);
    });
  }

  // User Message Processing
  function handleUserMessage(userText) {
    appendUserMessage(userText);
    showTypingIndicator();

    // Natural typing delay simulation (450ms - 900ms)
    setTimeout(() => {
      removeTypingIndicator();
      const botResponse = generateAIResponse(userText);
      appendBotMessage(botResponse.html, botResponse.followUpChips);
      if (botResponse.action) {
        botResponse.action();
      }
    }, 600);
  }

  // DOM Message Appenders
  function appendUserMessage(text) {
    const stream = document.getElementById('mitra-chat-stream');
    if (!stream) return;

    const msg = document.createElement('div');
    msg.className = 'flex justify-end';
    msg.innerHTML = `
      <div class="max-w-[85%] bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 shadow-md shadow-cyan-900/20 text-xs break-words">
        ${escapeHtml(text)}
      </div>
    `;
    stream.appendChild(msg);
    scrollChatToBottom();
  }

  function appendBotMessage(htmlContent, followUps = []) {
    const stream = document.getElementById('mitra-chat-stream');
    if (!stream) return;

    const msg = document.createElement('div');
    msg.className = 'flex items-start gap-2.5';
    msg.innerHTML = `
      <div class="w-7 h-7 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8V4H8"></path>
          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
          <path d="M2 14h2"></path>
          <path d="M20 14h2"></path>
          <path d="M15 13v2"></path>
          <path d="M9 13v2"></path>
        </svg>
      </div>
      <div class="max-w-[88%] space-y-2">
        <div class="bg-slate-900/90 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-sm p-3.5 shadow-lg leading-relaxed text-xs space-y-2 break-words">
          ${htmlContent}
        </div>
      </div>
    `;
    stream.appendChild(msg);
    scrollChatToBottom();

    if (followUps && followUps.length > 0) {
      renderQuickChips(followUps);
    }
  }

  function showTypingIndicator() {
    STATE.isTyping = true;
    const stream = document.getElementById('mitra-chat-stream');
    if (!stream) return;

    const typing = document.createElement('div');
    typing.id = 'mitra-typing-indicator';
    typing.className = 'flex items-center gap-2 text-slate-400 text-xs';
    typing.innerHTML = `
      <div class="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
        <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
      </div>
      <div class="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.3s]"></span>
        <span class="text-[10px] text-slate-400 ml-1">Mitra is analyzing...</span>
      </div>
    `;
    stream.appendChild(typing);
    scrollChatToBottom();
  }

  function removeTypingIndicator() {
    STATE.isTyping = false;
    const indicator = document.getElementById('mitra-typing-indicator');
    if (indicator) indicator.remove();
  }

  function scrollChatToBottom() {
    const stream = document.getElementById('mitra-chat-stream');
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  }

  // AI Response Generation Engine (Natural Language Pattern Matcher)
  function generateAIResponse(rawQuery) {
    const q = rawQuery.toLowerCase();

    // 1. CAREER & HIRING QUERIES
    if (
      q.includes('job') || q.includes('career') || q.includes('hiring') || 
      q.includes('vacancy') || q.includes('opening') || q.includes('work with') ||
      q.includes('apply') || q.includes('resume') || q.includes('cv') ||
      q.includes('intern') || q.includes('fresher') || q.includes('salary') ||
      q.includes('interview') || q.includes('naukri') || q.includes('join')
    ) {
      return handleCareerQuery(q);
    }

    // 2. HEALTHCARE & CLINIC QUERIES
    if (
      q.includes('clinic') || q.includes('hospital') || q.includes('doctor') ||
      q.includes('patient') || q.includes('opd') || q.includes('healthcare') ||
      q.includes('dental') || q.includes('ivf')
    ) {
      return handleHealthcareQuery(q);
    }

    // 3. PRICING, BUDGET & PACKAGES
    if (
      q.includes('price') || q.includes('pricing') || q.includes('package') ||
      q.includes('cost') || q.includes('rate') || q.includes('fee') ||
      q.includes('budget') || q.includes('charge') || q.includes('kitna') ||
      q.includes('rupees') || q.includes('₹')
    ) {
      return handlePricingQuery(q);
    }

    // 4. PERFORMANCE MARKETING & ADS
    if (
      q.includes('meta ad') || q.includes('google ad') || q.includes('ad') ||
      q.includes('roas') || q.includes('campaign') || q.includes('facebook ad') ||
      q.includes('instagram ad') || q.includes('paid lead')
    ) {
      return handleAdsQuery(q);
    }

    // 5. SEO & LOCAL GOOGLE MAPS
    if (
      q.includes('seo') || q.includes('google map') || q.includes('ranking') ||
      q.includes('rank') || q.includes('organic') || q.includes('gmb') ||
      q.includes('local search')
    ) {
      return handleSeoQuery(q);
    }

    // 6. WEBSITE & LANDING PAGES
    if (
      q.includes('website') || q.includes('web') || q.includes('landing page') ||
      q.includes('developer') || q.includes('ui/ux') || q.includes('redesign')
    ) {
      return handleWebsiteQuery(q);
    }

    // 7. BOOK CONSULTATION / CONTACT
    if (
      q.includes('consultation') || q.includes('book') || q.includes('call') ||
      q.includes('contact') || q.includes('talk') || q.includes('meeting') ||
      q.includes('phone') || q.includes('email') || q.includes('connect')
    ) {
      return handleConsultationQuery(q);
    }

    // 8. GENERAL GREETINGS / SMALL TALK
    if (
      q.includes('hi') || q.includes('hello') || q.includes('hey') || 
      q.includes('namaste') || q.includes('kaise') || q.includes('who are you') ||
      q.includes('kya karte ho')
    ) {
      return handleGreetingQuery(q);
    }

    // 9. LEAD INTAKE (Visitor provides phone or email)
    const emailMatch = rawQuery.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = rawQuery.match(/(\+91|0)?[6-9]\d{9}/);
    if (emailMatch || phoneMatch) {
      return handleDirectLeadIntake(rawQuery, emailMatch ? emailMatch[0] : null, phoneMatch ? phoneMatch[0] : null);
    }

    // 10. DEFAULT INTELLIGENT FALLBACK
    return handleGeneralQuery(rawQuery);
  }

  // --- Specific Intent Handlers ---

  function handleCareerQuery(q) {
    const rolesList = KNOWLEDGE.careers.openRoles
      .map(r => `<div class="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center text-[11px]">
        <div>
          <span class="font-bold text-white block">${r.title}</span>
          <span class="text-[10px] text-slate-400">${r.type} &bull; Exp: ${r.exp}</span>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Hiring</span>
      </div>`).join('');

    const html = `
      <div class="space-y-2">
        <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          We Are Hiring! &bull; Join Curafy Digitech
        </div>
        <p class="font-medium text-white">We are currently hiring for high-growth roles:</p>
        <div class="space-y-1.5 my-2">
          ${rolesList}
        </div>
        <p class="text-[11px] text-slate-300">
          <strong>How to Apply:</strong> You can click the button below to submit your resume immediately, or email CV to <a href="mailto:${TARGET_EMAIL}?subject=Job Application" class="text-cyan-400 underline font-mono font-medium">${TARGET_EMAIL}</a>.
        </p>
        <div class="pt-1.5 flex flex-wrap gap-2">
          <button onclick="window.openModal && window.openModal('careers-modal')" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all">
            <span>🚀 Open Application Form</span>
          </button>
          <a href="mailto:${TARGET_EMAIL}?subject=Direct Job Application - Curafy Digitech" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-cyan-500/30 flex items-center gap-1">
            <span>✉️ Email CV</span>
          </a>
        </div>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '💼 Apply for Role', query: 'I want to submit an application.' },
        { label: '🏢 Work Culture & Perks', query: 'What are the benefits and culture like at Curafy Digitech?' },
        { label: '📈 Client Marketing Services', query: 'What marketing services do you provide?' },
        { label: '📋 Book Consultation', query: 'Book a strategy consultation' }
      ]
    };
  }

  function handleHealthcareQuery(q) {
    const html = `
      <div class="space-y-2">
        <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold">
          🏥 Specialized Healthcare Division
        </div>
        <p class="font-bold text-white">Patient Acquisition Engine for Clinics &amp; Hospitals:</p>
        <p class="text-slate-300 text-[11px]">
          We manage dedicated patient booking engines for <strong>IVF Centers, Dental Chains, Eye Hospitals, and Specialist Clinics</strong>, driving <strong>120–250+ confirmed monthly OPD appointments</strong>.
        </p>
        <ul class="space-y-1 text-[11px] text-slate-300 pl-1">
          <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> Google Maps #1 rank for local doctor searches</li>
          <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> High-intent Meta &amp; Google Ads with verified patient leads</li>
          <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> Automated OPD booking and WhatsApp confirmation integration</li>
        </ul>
        <div class="pt-2 flex flex-wrap gap-2">
          <button onclick="window.openModal && window.openModal('consultation-modal')" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md">
            Schedule Clinic Growth Session
          </button>
          <a href="healthcare.html" class="px-3 py-2 rounded-xl bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold">
            View Healthcare Portal &rarr;
          </a>
        </div>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '💰 Healthcare Pricing', query: 'What are the charges for clinic digital marketing?' },
        { label: '📈 Case Studies', query: 'Show me case studies and proof of results.' },
        { label: '💼 Career Openings', query: 'Are you hiring healthcare marketers?' }
      ]
    };
  }

  function handlePricingQuery(q) {
    const tiersHtml = KNOWLEDGE.business.packages.map(p => `
      <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-0.5">
        <div class="flex justify-between items-center">
          <strong class="text-white">${p.tier}</strong>
          <span class="text-cyan-400 font-mono font-bold">${p.range}</span>
        </div>
        <p class="text-[10px] text-slate-400">${p.ideal}</p>
      </div>
    `).join('');

    const html = `
      <div class="space-y-2">
        <h5 class="font-bold text-white">Curafy Digitech Transparent Packages:</h5>
        <div class="space-y-1.5 my-2">
          ${tiersHtml}
        </div>
        <p class="text-[11px] text-slate-300">
          Every plan includes complete ad creation, tracking pixels, daily performance optimization, and weekly reporting. Response time under 2 hrs!
        </p>
        <div class="pt-1">
          <button onclick="window.openModal && window.openModal('consultation-modal')" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md">
            Get Custom Quotation for My Business
          </button>
        </div>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '📋 Request Custom Quote', query: 'I want a custom quotation for my budget.' },
        { label: '📈 Expected ROAS & Leads', query: 'What returns can I expect on my marketing spend?' },
        { label: '💼 We Are Hiring', query: 'What jobs are open?' }
      ]
    };
  }

  function handleAdsQuery(q) {
    const html = `
      <div class="space-y-2">
        <p class="font-bold text-white">Performance Marketing &amp; Paid Lead Engine:</p>
        <p class="text-[11px] text-slate-300">
          We operate data-driven <strong>Meta (Facebook &amp; Instagram)</strong> and <strong>Google Ads</strong> campaigns engineered around profitability rather than vanity metrics.
        </p>
        <div class="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] space-y-1">
          <div class="flex justify-between text-white"><span>Average Portfolio ROAS:</span> <strong class="text-gradient-neon font-mono">3.8x ROAS</strong></div>
          <div class="flex justify-between text-white"><span>CAC Reduction:</span> <strong class="text-emerald-400 font-mono">-35% to -50%</strong></div>
          <div class="flex justify-between text-white"><span>Conversion Lead Tracking:</span> <strong class="text-cyan-300 font-mono">100% Verified</strong></div>
        </div>
        <p class="text-[11px] text-slate-400">Want us to audit your existing ad account or launch new profitable campaigns?</p>
        <button onclick="window.openModal && window.openModal('consultation-modal')" class="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs">
          Claim Free Ad Account Audit
        </button>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '💰 Ad Packages', query: 'What is the pricing for running ads?' },
        { label: '🏥 Clinic Ads', query: 'How do you run ads for hospitals?' },
        { label: '💼 Join Ad Team', query: 'Are you hiring Meta and Google Ads experts?' }
      ]
    };
  }

  function handleSeoQuery(q) {
    const html = `
      <div class="space-y-2">
        <p class="font-bold text-white">Search Engine Optimization &amp; Google Local Pack:</p>
        <p class="text-[11px] text-slate-300">
          We help local businesses and healthcare clinics secure <strong>Rank #1 on Google Local 3-Pack Maps</strong> and drive sustainable organic website traffic.
        </p>
        <div class="space-y-1 text-[11px] text-slate-300 pl-1">
          <div>🔍 <strong>Local Map Domination:</strong> Capture customers searching "near me".</div>
          <div>⚡ <strong>Technical Speed &amp; Core Web Vitals:</strong> Sub-second page loads.</div>
          <div>🏆 <strong>Authoritative Backlinks &amp; Citations:</strong> Outrank competitors permanently.</div>
        </div>
        <button onclick="window.openModal && window.openModal('audit-modal')" class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-bold">
          Get Free SEO Audit Report
        </button>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '💰 SEO Pricing', query: 'How much does monthly SEO cost?' },
        { label: '💼 SEO Careers', query: 'Are you hiring SEO specialists?' },
        { label: '📋 Book Consultation', query: 'Book a consultation call' }
      ]
    };
  }

  function handleWebsiteQuery(q) {
    const html = `
      <div class="space-y-2">
        <p class="font-bold text-white">High-Converting Websites &amp; 3D Landing Pages:</p>
        <p class="text-[11px] text-slate-300">
          We engineer high-speed, modern websites with interactive 3D perspectives, mobile-first responsive layouts, and integrated direct enquiry portals.
        </p>
        <ul class="text-[11px] text-slate-300 space-y-1">
          <li>🚀 <strong>Lightning Fast:</strong> 90+ Google PageSpeed score.</li>
          <li>🎯 <strong>Lead-Optimized:</strong> High-converting CTA buttons &amp; direct email integration.</li>
          <li>📱 <strong>Flawless Mobile:</strong> Built to convert on smartphones.</li>
        </ul>
        <button onclick="window.openModal && window.openModal('consultation-modal')" class="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs">
          Discuss Website Development
        </button>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '💰 Website Cost', query: 'What is the cost for a new website?' },
        { label: '💼 Web Dev Jobs', query: 'Are you hiring web developers?' }
      ]
    };
  }

  function handleConsultationQuery(q) {
    const html = `
      <div class="space-y-2">
        <p class="font-bold text-white">Book Your 1-on-1 Growth Strategy Session:</p>
        <p class="text-[11px] text-slate-300">
          Connect directly with a Senior Growth Strategist to analyze your business goals, target customer persona, and ad roadmap.
        </p>
        <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
          <div class="text-cyan-300">🕒 <strong>Response Time:</strong> Under 2 hrs (Mon–Sat)</div>
          <div class="text-slate-300">✉️ <strong>Official Desk:</strong> <span class="font-mono text-white">${TARGET_EMAIL}</span></div>
        </div>
        <button onclick="window.openModal && window.openModal('consultation-modal')" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg">
          Click Here to Book Consultation Now
        </button>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '💼 Career Opportunities', query: 'Tell me about jobs at Curafy Digitech' },
        { label: '🏥 Healthcare Portal', query: 'Tell me about healthcare services' }
      ]
    };
  }

  function handleGreetingQuery(q) {
    const html = `
      <div class="space-y-2">
        <p class="text-white font-medium">Hello! Welcome to <strong>Curafy Digitech</strong>. 👋</p>
        <p class="text-[11px] text-slate-300">
          I am <strong>Mitra</strong>, your 24x7 intelligent digital advisor. I can help you scale your business revenue with performance marketing or help you apply for exciting career positions at our firm!
        </p>
        <p class="text-[11px] text-cyan-300">What would you like to explore right now?</p>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '📈 Grow My Business', query: 'How to scale my business?' },
        { label: '💼 Job Openings', query: 'What career openings are available?' },
        { label: '💰 Pricing & Plans', query: 'What are your marketing packages?' },
        { label: '🏥 Healthcare Marketing', query: 'Healthcare marketing details' }
      ]
    };
  }

  function handleDirectLeadIntake(text, email, phone) {
    const contactInfo = [email, phone].filter(Boolean).join(' | ');

    // Send lead to FormSubmit AJAX endpoint in background
    dispatchLeadToEmail({
      name: 'Mitra AI Chat Visitor',
      contact: contactInfo,
      message: text,
      source: 'Mitra AI Messenger Widget'
    });

    const html = `
      <div class="space-y-2">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold">
          <span>✓</span> Inquiry Received Successfully!
        </div>
        <p class="font-bold text-white">Thank you for sharing your contact details!</p>
        <p class="text-[11px] text-slate-300">
          Our senior director has received your message and contact information (<span class="text-cyan-300 font-mono">${contactInfo}</span>). We will review your requirements and respond back <strong>within 2 hours</strong>!
        </p>
        <p class="text-[10px] text-slate-400">
          Copy dispatched to: <span class="font-mono text-cyan-400">${TARGET_EMAIL}</span>
        </p>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '💼 Explore Open Roles', query: 'What jobs are open?' },
        { label: '📈 Marketing Services', query: 'Tell me about all services' }
      ]
    };
  }

  function handleGeneralQuery(rawQuery) {
    const html = `
      <div class="space-y-2">
        <p class="text-white font-medium">Thank you for asking about: <em>"${escapeHtml(rawQuery)}"</em></p>
        <p class="text-[11px] text-slate-300">
          At <strong>Curafy Digitech</strong>, we specialize in high-ROI digital marketing (Google/Meta Ads, Local SEO, and Custom Web Engineering) as well as continuous talent hiring.
        </p>
        <div class="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <button onclick="window.openModal && window.openModal('consultation-modal')" class="p-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-slate-800 font-semibold transition-all">
            📈 Business Growth
          </button>
          <button onclick="window.openModal && window.openModal('careers-modal')" class="p-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-slate-800 font-semibold transition-all">
            💼 Career / Jobs
          </button>
        </div>
        <p class="text-[10px] text-slate-400">
          Or leave your phone number / email here and our growth director will contact you within 2 hours.
        </p>
      </div>
    `;

    return {
      html,
      followUpChips: [
        { label: '💼 View Job Openings', query: 'What career openings are available?' },
        { label: '📈 Services & Strategy', query: 'Tell me about performance marketing' },
        { label: '💰 Pricing & Packages', query: 'What are your marketing packages?' }
      ]
    };
  }

  // Lead Dispatcher via FormSubmit AJAX
  async function dispatchLeadToEmail(payload) {
    try {
      const body = {
        _subject: 'New Lead via Mitra AI Messenger - Curafy Digitech',
        _template: 'table',
        _captcha: 'false',
        _cc: CC_EMAIL,
        Visitor_Contact: payload.contact,
        Visitor_Message: payload.message,
        Source: payload.source,
        Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        Page_URL: window.location.href
      };

      await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.warn('Mitra lead dispatch notice:', err);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Bootstrapping
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMitra);
  } else {
    initMitra();
  }

})();
