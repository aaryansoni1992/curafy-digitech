// Curafy Digitech - SEO Admin Panel Application Logic (Local & Live Mode with Google Sign-In)

const REPO_OWNER = 'aaryansoni1992';
const REPO_NAME = 'curafy-digitech';
const REPO_BRANCH = 'main';

// Default Allowed Admin Emails (can be extended via UI settings)
const DEFAULT_ALLOWED_EMAILS = [
  'aaryansoni1992@gmail.com',
  'contact@curafydigitech.com',
  'curafydigitech@gmail.com'
];

let pagesData = [];
let activeIndex = 0;
let currentDomain = 'https://www.curafydigitech.com';
let serpDevice = 'desktop';

const isLocalMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// --- AUTHENTICATION & SESSION MANAGEMENT ---

function getStoredUser() {
  try {
    const raw = localStorage.getItem('curafy_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveUserSession(userObj) {
  localStorage.setItem('curafy_admin_user', JSON.stringify(userObj));
}

function clearUserSession() {
  localStorage.removeItem('curafy_admin_user');
}

function getAllowedEmails() {
  const custom = localStorage.getItem('curafy_allowed_emails');
  if (custom) {
    return custom.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_ALLOWED_EMAILS.map(e => e.toLowerCase());
}

function getGoogleClientId() {
  return localStorage.getItem('curafy_google_client_id') || '';
}

function getGithubToken() {
  return localStorage.getItem('curafy_github_token') || '';
}

// Decode Google JWT Credential
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Handle Google Login Callback
window.handleGoogleCredentialResponse = function(response) {
  const payload = parseJwt(response.credential);
  if (!payload || !payload.email) {
    showAuthAlert('Unable to decode Google account details. Please try again.', 'error');
    return;
  }

  const email = payload.email.toLowerCase();
  const allowed = getAllowedEmails();

  if (allowed.length > 0 && !allowed.includes(email)) {
    showAuthAlert(`Access Denied: Google account (${email}) is not on the authorized admin whitelist.`, 'error');
    return;
  }

  // Login successful
  const user = {
    email: email,
    name: payload.name || email.split('@')[0],
    picture: payload.picture || '/assets/images/curafy-logo-mark.png',
    loginType: 'google',
    loginTime: Date.now()
  };

  saveUserSession(user);
  showToast(`Welcome back, ${user.name}! Logged in as ${email}`, 'success');
  renderAuthenticatedUI(user);
};

// Initialize Google Identity Services (GIS)
function initGoogleAuth() {
  const clientId = getGoogleClientId();
  const btnContainer = document.getElementById('google-signin-btn-container');

  if (!btnContainer) return;

  if (window.google && google.accounts && google.accounts.id) {
    if (clientId) {
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: window.handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(btnContainer, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 280
        });
        return;
      } catch (err) {
        console.warn('Google Auth Init Error:', err);
      }
    }
  }

  // If Client ID not yet set up in Google Cloud Console
  btnContainer.innerHTML = `
    <div class="space-y-2.5 w-full">
      <button type="button" onclick="promptGoogleClientIdSetup()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs transition shadow-sm">
        <svg class="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>Connect Google Sign-In</span>
      </button>
      <div class="text-[11px] text-slate-400">
        Click above to link your Google OAuth Client ID, or use 
        <button type="button" onclick="toggleManualLogin()" class="text-cyan-400 hover:underline">Passcode Login</button>
      </div>
    </div>
  `;
}

function promptGoogleClientIdSetup() {
  toggleAuthSettings();
  showAuthAlert('Enter your Google OAuth Client ID in Security Settings below to activate one-click Google Sign-In.', 'info');
}

function toggleManualLogin() {
  const fb = document.getElementById('auth-manual-fallback');
  fb.classList.toggle('hidden');
}

function toggleAuthSettings() {
  const panel = document.getElementById('auth-settings-panel');
  panel.classList.toggle('hidden');
  document.getElementById('config-google-client-id').value = getGoogleClientId();
  document.getElementById('config-allowed-emails').value = getAllowedEmails().join(', ');
  document.getElementById('config-github-token').value = getGithubToken();
}

function saveAuthSettings() {
  const cid = document.getElementById('config-google-client-id').value.trim();
  const emails = document.getElementById('config-allowed-emails').value.trim();
  const token = document.getElementById('config-github-token').value.trim();

  if (cid) localStorage.setItem('curafy_google_client_id', cid);
  if (emails) localStorage.setItem('curafy_allowed_emails', emails);
  if (token) localStorage.setItem('curafy_github_token', token);

  showToast('Security settings saved!', 'success');
  toggleAuthSettings();
  initGoogleAuth();
}

function loginWithManualEmail() {
  const email = (document.getElementById('input-auth-email').value || '').trim().toLowerCase();
  const pin = (document.getElementById('input-auth-pin').value || '').trim();

  const allowed = getAllowedEmails();

  if (!email || !email.includes('@')) {
    showAuthAlert('Please enter a valid Gmail / Email address.', 'error');
    return;
  }

  // Passcode check (default: curafy2026 or whitelist verification)
  if (pin !== 'curafy2026' && !pin.includes('curafy')) {
    showAuthAlert('Invalid Admin Passcode.', 'error');
    return;
  }

  if (allowed.length > 0 && !allowed.includes(email)) {
    showAuthAlert(`Email (${email}) is not on the admin whitelist.`, 'error');
    return;
  }

  const user = {
    email: email,
    name: email.split('@')[0],
    picture: '/assets/images/curafy-logo-mark.png',
    loginType: 'manual',
    loginTime: Date.now()
  };

  saveUserSession(user);
  showToast(`Authenticated as ${email}!`, 'success');
  renderAuthenticatedUI(user);
}

function logoutAdmin() {
  if (!confirm('Are you sure you want to log out of the SEO Admin Panel?')) return;
  clearUserSession();
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  showToast('Logged out successfully', 'info');
  document.getElementById('auth-gate-screen').classList.remove('hidden');
  initGoogleAuth();
}

function showAuthAlert(msg, type = 'error') {
  const box = document.getElementById('auth-alert-box');
  box.classList.remove('hidden', 'bg-rose-950/40', 'border-rose-500/30', 'text-rose-300', 'bg-blue-950/40', 'border-blue-500/30', 'text-blue-300');
  if (type === 'error') {
    box.classList.add('bg-rose-950/40', 'border-rose-500/30', 'text-rose-300');
  } else {
    box.classList.add('bg-blue-950/40', 'border-blue-500/30', 'text-blue-300');
  }
  box.innerHTML = msg;
}

function renderAuthenticatedUI(user) {
  document.getElementById('auth-gate-screen').classList.add('hidden');
  document.getElementById('user-display-name').textContent = user.name || 'Admin';
  document.getElementById('user-display-email').textContent = user.email || '';
  if (user.picture) {
    document.getElementById('user-avatar-img').src = user.picture;
  }
  refreshIcons();
  fetchPages();
}

// Check session on startup
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // Live vs Local mode badge
  const liveBadge = document.getElementById('live-mode-badge');
  if (isLocalMode) {
    liveBadge.textContent = 'Local Mode (Node.js)';
    liveBadge.className = 'text-cyan-400 font-semibold';
  } else {
    liveBadge.textContent = 'Live Mode (GitHub Sync)';
    liveBadge.className = 'text-emerald-400 font-semibold';
  }

  const currentUser = getStoredUser();
  if (currentUser && currentUser.email) {
    renderAuthenticatedUI(currentUser);
  } else {
    document.getElementById('auth-gate-screen').classList.remove('hidden');
    // Wait for GIS script to load
    setTimeout(initGoogleAuth, 400);
  }
});

function refreshIcons() {
  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

// --- DATA FETCHING (DUAL MODE: LOCAL API VS GITHUB API) ---

const PAGE_FILES = [
  'index.html',
  'services.html',
  'healthcare.html',
  'landing.html',
  'case-studies.html',
  'about.html',
  'blog.html',
  'contact.html',
  'thank-you.html'
];

async function fetchPages() {
  if (isLocalMode) {
    // Local API mode
    try {
      const res = await fetch('/api/pages');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch pages');

      pagesData = json.pages || [];
      currentDomain = json.domain || 'https://www.curafydigitech.com';
      document.getElementById('site-domain-display').textContent = currentDomain;
      updateSiteHealthHeader(json);
      renderPagesList();

      if (pagesData.length > 0) {
        selectPage(activeIndex >= pagesData.length ? 0 : activeIndex);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  } else {
    // Live GitHub Pages mode (reads directly from GitHub repository)
    try {
      pagesData = [];
      document.getElementById('pages-list-container').innerHTML = `<div class="p-4 text-center text-xs text-cyan-400"><i data-lucide="loader" class="w-4 h-4 animate-spin inline mr-1"></i> Syncing live pages from GitHub...</div>`;
      refreshIcons();

      const promises = PAGE_FILES.map(async (filename) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${filename}?t=${Date.now()}`;
          const res = await fetch(rawUrl);
          if (!res.ok) return null;
          const html = await res.text();
          return parseHtmlInBrowser(filename, html);
        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(promises);
      pagesData = results.filter(Boolean);

      // Compute aggregate stats
      const totalScore = pagesData.reduce((acc, p) => acc + (p.seoScore || 0), 0);
      const avgScore = pagesData.length > 0 ? Math.round(totalScore / pagesData.length) : 0;
      let criticalIssues = 0;
      let warnings = 0;
      pagesData.forEach(p => {
        (p.checks || []).forEach(c => {
          if (!c.passed) {
            if (c.type === 'critical') criticalIssues++;
            else if (c.type === 'warning') warnings++;
          }
        });
      });

      updateSiteHealthHeader({
        siteAverageScore: avgScore,
        criticalIssues,
        warnings
      });

      renderPagesList();
      if (pagesData.length > 0) {
        selectPage(0);
      }
    } catch (err) {
      showToast(`Live sync failed: ${err.message}`, 'error');
    }
  }
}

// In-Browser HTML Parser for Live Mode
function parseHtmlInBrowser(filename, html) {
  const title = extractTitle(html);
  const description = extractMetaTag(html, 'description', 'name');
  const keywords = extractMetaTag(html, 'keywords', 'name');
  const robots = extractMetaTag(html, 'robots', 'name') || 'index, follow';
  const canonical = extractCanonical(html);

  const ogTitle = extractMetaTag(html, 'og:title', 'property') || extractMetaTag(html, 'og:title', 'name');
  const ogDescription = extractMetaTag(html, 'og:description', 'property') || extractMetaTag(html, 'og:description', 'name');
  const ogImage = extractMetaTag(html, 'og:image', 'property') || extractMetaTag(html, 'og:image', 'name');
  const ogUrl = extractMetaTag(html, 'og:url', 'property') || extractMetaTag(html, 'og:url', 'name');
  const ogType = extractMetaTag(html, 'og:type', 'property') || 'website';
  const ogSiteName = extractMetaTag(html, 'og:site_name', 'property') || 'Curafy Digitech';

  const twitterCard = extractMetaTag(html, 'twitter:card', 'name') || 'summary_large_image';
  const twitterTitle = extractMetaTag(html, 'twitter:title', 'name') || extractMetaTag(html, 'twitter:title', 'property');
  const twitterDescription = extractMetaTag(html, 'twitter:description', 'name') || extractMetaTag(html, 'twitter:description', 'property');
  const twitterImage = extractMetaTag(html, 'twitter:image', 'name') || extractMetaTag(html, 'twitter:image', 'property');

  const schemas = extractJsonLd(html);
  const contentAnalysis = analyzePageContent(html);

  const pageData = {
    filename,
    fileSize: `${(html.length / 1024).toFixed(1)} KB`,
    lastModified: new Date().toISOString(),
    rawHtml: html,
    title,
    description,
    keywords,
    robots,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    ogType,
    ogSiteName,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    schemas,
    contentAnalysis
  };

  const audit = calculateSeoScore(pageData);
  pageData.seoScore = audit.score;
  pageData.checks = audit.checks;

  return pageData;
}

// Client-side HTML Regex Helpers
function unescapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractMetaTag(html, nameOrProp, attr = 'name') {
  const escaped = nameOrProp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex1 = new RegExp(`<meta\\s+[^>]*?${attr}=["']${escaped}["'][^>]*?content=(?:"([^"]*)"|'([^']*)')[^>]*>`, 'i');
  const regex2 = new RegExp(`<meta\\s+[^>]*?content=(?:"([^"]*)"|'([^']*)')[^>]*?${attr}=["']${escaped}["'][^>]*>`, 'i');
  let match = html.match(regex1) || html.match(regex2);
  if (match) return unescapeHtml(match[1] !== undefined ? match[1] : match[2]);
  return '';
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? unescapeHtml(m[1].trim()) : '';
}

function extractCanonical(html) {
  const m = html.match(/<link\s+[^>]*?rel=["']canonical["'][^>]*?href=(?:"([^"]*)"|'([^']*)')[^>]*>/i) ||
            html.match(/<link\s+[^>]*?href=(?:"([^"]*)"|'([^']*)')[^>]*?rel=["']canonical["'][^>]*>/i);
  return m ? unescapeHtml(m[1] !== undefined ? m[1] : m[2]) : '';
}

function extractJsonLd(html) {
  const schemas = [];
  const regex = /<script\s+[^>]*?type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      schemas.push(JSON.parse(match[1].trim()));
    } catch (e) {}
  }
  return schemas;
}

function analyzePageContent(html) {
  const h1Matches = [];
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let h1M;
  while ((h1M = h1Regex.exec(html)) !== null) {
    const text = h1M[1].replace(/<[^>]+>/g, '').trim();
    if (text) h1Matches.push(unescapeHtml(text));
  }

  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;

  const imgRegex = /<img\s+([^>]*?)>/gi;
  let imgM;
  let totalImages = 0;
  const missingAltImages = [];
  while ((imgM = imgRegex.exec(html)) !== null) {
    const attrs = imgM[1];
    if (/facebook\.com\/tr|google-analytics|display:\s*none|height=["']1["']|width=["']1["']/i.test(attrs)) continue;
    totalImages++;
    const srcMatch = attrs.match(/src=(?:"([^"]*)"|'([^']*)')/i);
    const src = srcMatch ? (srcMatch[1] || srcMatch[2]) : 'unknown';
    const altMatch = attrs.match(/alt=(?:"([^"]*)"|'([^']*)')/i);
    const altVal = altMatch ? (altMatch[1] || altMatch[2] || '') : '';
    if (!altMatch || !altVal.trim()) missingAltImages.push(src);
  }

  const cleanBody = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleanBody ? cleanBody.split(/\s+/).length : 0;

  return { h1s: h1Matches, h2Count, h3Count, totalImages, missingAltImages, wordCount: words };
}

function calculateSeoScore(pageData) {
  let score = 0;
  const checks = [];

  // Title
  if (!pageData.title) {
    checks.push({ id: 'title', passed: false, type: 'critical', message: 'Missing <title> tag' });
  } else if (pageData.title.length < 30) {
    score += 8;
    checks.push({ id: 'title', passed: false, type: 'warning', message: `Title is short (${pageData.title.length} chars). Aim for 50-60.` });
  } else if (pageData.title.length > 65) {
    score += 10;
    checks.push({ id: 'title', passed: false, type: 'warning', message: `Title is long (${pageData.title.length} chars). May get cut off in Google.` });
  } else {
    score += 15;
    checks.push({ id: 'title', passed: true, type: 'success', message: `Title length is optimal (${pageData.title.length} chars).` });
  }

  // Meta Description
  if (!pageData.description) {
    checks.push({ id: 'desc', passed: false, type: 'critical', message: 'Missing Meta Description tag.' });
  } else if (pageData.description.length < 100) {
    score += 8;
    checks.push({ id: 'desc', passed: false, type: 'warning', message: `Description is short (${pageData.description.length} chars). Aim for 140-160.` });
  } else if (pageData.description.length > 165) {
    score += 10;
    checks.push({ id: 'desc', passed: false, type: 'warning', message: `Description is long (${pageData.description.length} chars). May be clipped.` });
  } else {
    score += 15;
    checks.push({ id: 'desc', passed: true, type: 'success', message: `Description length is ideal (${pageData.description.length} chars).` });
  }

  // Canonical
  if (pageData.canonical) {
    score += 10;
    checks.push({ id: 'canonical', passed: true, type: 'success', message: `Canonical configured: ${pageData.canonical}` });
  } else {
    checks.push({ id: 'canonical', passed: false, type: 'warning', message: 'Missing canonical URL link tag.' });
  }

  // H1
  if (!pageData.contentAnalysis.h1s || pageData.contentAnalysis.h1s.length === 0) {
    checks.push({ id: 'h1', passed: false, type: 'critical', message: 'No <h1> heading tag found on this page.' });
  } else if (pageData.contentAnalysis.h1s.length > 1) {
    score += 8;
    checks.push({ id: 'h1', passed: false, type: 'warning', message: `Multiple <h1> tags found (${pageData.contentAnalysis.h1s.length}).` });
  } else {
    score += 15;
    checks.push({ id: 'h1', passed: true, type: 'success', message: `One prominent <h1> found: "${pageData.contentAnalysis.h1s[0].substring(0, 45)}..."` });
  }

  // Open Graph
  const hasOgTitle = Boolean(pageData.ogTitle || pageData.title);
  const hasOgDesc = Boolean(pageData.ogDescription || pageData.description);
  const hasOgImage = Boolean(pageData.ogImage);
  if (hasOgTitle && hasOgDesc && hasOgImage) {
    score += 15;
    checks.push({ id: 'og', passed: true, type: 'success', message: 'Open Graph social tags complete.' });
  } else if (hasOgTitle || hasOgDesc || hasOgImage) {
    score += 8;
    checks.push({ id: 'og', passed: false, type: 'warning', message: 'Incomplete Open Graph tags. Image or description is missing.' });
  } else {
    checks.push({ id: 'og', passed: false, type: 'warning', message: 'No Open Graph social tags detected.' });
  }

  // Twitter
  if (pageData.twitterCard && (pageData.twitterTitle || pageData.title)) {
    score += 10;
    checks.push({ id: 'twitter', passed: true, type: 'success', message: `Twitter Card configured (${pageData.twitterCard}).` });
  } else {
    checks.push({ id: 'twitter', passed: false, type: 'info', message: 'Twitter card not configured (falls back to Open Graph).' });
  }

  // Schema
  if (pageData.schemas && pageData.schemas.length > 0) {
    score += 10;
    checks.push({ id: 'schema', passed: true, type: 'success', message: `Structured Data detected (${pageData.schemas.length} schema).` });
  } else {
    checks.push({ id: 'schema', passed: false, type: 'warning', message: 'No Schema.org JSON-LD found.' });
  }

  // Image Alts
  if (pageData.contentAnalysis.totalImages > 0) {
    const missing = pageData.contentAnalysis.missingAltImages.length;
    if (missing === 0) {
      score += 10;
      checks.push({ id: 'images', passed: true, type: 'success', message: `All ${pageData.contentAnalysis.totalImages} images have ALT attributes.` });
    } else {
      score += Math.max(0, Math.round(10 * (1 - missing / pageData.contentAnalysis.totalImages)));
      checks.push({ id: 'images', passed: false, type: 'warning', message: `${missing} of ${pageData.contentAnalysis.totalImages} images missing ALT attributes.` });
    }
  } else {
    score += 10;
    checks.push({ id: 'images', passed: true, type: 'info', message: 'No content images on page.' });
  }

  return { score: Math.min(100, score), checks };
}

// Update Site Health Header UI
function updateSiteHealthHeader(data) {
  const avg = data.siteAverageScore || 0;
  const scoreText = document.getElementById('site-avg-score-text');
  const scoreCircle = document.getElementById('site-score-circle');
  const healthStatus = document.getElementById('site-health-status');

  scoreText.textContent = `${avg}`;
  const offset = 100 - avg;
  scoreCircle.style.strokeDashoffset = offset;

  if (avg >= 85) {
    scoreCircle.className.baseVal = 'text-emerald-400 transition-all duration-700';
    healthStatus.textContent = 'Excellent Health';
    healthStatus.className = 'text-xs font-medium text-emerald-400';
  } else if (avg >= 65) {
    scoreCircle.className.baseVal = 'text-amber-400 transition-all duration-700';
    healthStatus.textContent = 'Good (Needs Polish)';
    healthStatus.className = 'text-xs font-medium text-amber-400';
  } else {
    scoreCircle.className.baseVal = 'text-rose-400 transition-all duration-700';
    healthStatus.textContent = 'Needs Attention';
    healthStatus.className = 'text-xs font-medium text-rose-400';
  }

  document.getElementById('stat-total-pages').textContent = pagesData.length;
  document.getElementById('stat-critical-issues').textContent = data.criticalIssues || 0;
  document.getElementById('stat-warnings').textContent = data.warnings || 0;
  document.getElementById('page-count-badge').textContent = `${pagesData.length} files`;
}

// Render Left Sidebar Pages List
function renderPagesList() {
  const container = document.getElementById('pages-list-container');
  const search = (document.getElementById('page-search-input').value || '').toLowerCase();

  const filtered = pagesData.filter(p => {
    return p.filename.toLowerCase().includes(search) || (p.title && p.title.toLowerCase().includes(search));
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-500">No matching pages found</div>`;
    return;
  }

  container.innerHTML = filtered.map((p) => {
    const originalIndex = pagesData.findIndex(item => item.filename === p.filename);
    const isActive = originalIndex === activeIndex;
    const score = p.seoScore || 0;

    let badgeClass = 'score-high';
    if (score < 60) badgeClass = 'score-low';
    else if (score < 80) badgeClass = 'score-med';

    const hasMissingMeta = !p.description || !p.canonical || !p.ogImage;

    return `
      <div onclick="selectPage(${originalIndex})" class="p-3 rounded-xl cursor-pointer border transition-all ${
        isActive 
          ? 'bg-curafy-surface border-cyan-500/50 shadow-md shadow-cyan-500/10' 
          : 'bg-curafy-navy/60 hover:bg-curafy-surface/80 border-curafy-border'
      }">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <i data-lucide="${p.filename === 'index.html' ? 'home' : 'file-code'}" class="w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}"></i>
            <span class="font-heading font-semibold text-xs ${isActive ? 'text-white' : 'text-slate-300'} truncate max-w-[140px]">${p.filename}</span>
          </div>
          <span class="score-badge px-2 py-0.5 text-[10px] ${badgeClass}">${score}</span>
        </div>
        <div class="text-[11px] text-slate-400 truncate pl-6">
          ${p.title ? escapeHtml(p.title) : '<span class="text-rose-400 italic">No Title Tag</span>'}
        </div>
        ${hasMissingMeta ? `
          <div class="mt-2 flex items-center gap-1.5 pl-6 text-[10px] text-amber-400/90">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Needs social / meta tags</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  refreshIcons();
}

function filterPagesList() {
  renderPagesList();
}

function reloadAllPages() {
  fetchPages();
  showToast('Reloaded all pages from repository', 'info');
}

// Select a Page
function selectPage(index) {
  activeIndex = index;
  renderPagesList();

  const page = pagesData[index];
  if (!page) return;

  document.getElementById('active-filename').textContent = page.filename;
  document.getElementById('active-filesize').textContent = page.fileSize;
  document.getElementById('active-lastmod').textContent = new Date(page.lastModified).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const scoreBadge = document.getElementById('active-score-badge');
  scoreBadge.textContent = `${page.seoScore || 0} / 100`;
  scoreBadge.className = `score-badge px-2.5 py-0.5 text-xs ${
    page.seoScore >= 80 ? 'score-high' : page.seoScore >= 60 ? 'score-med' : 'score-low'
  }`;

  document.getElementById('btn-view-current-page').href = `/${page.filename}`;

  // Form Population
  document.getElementById('input-title').value = page.title || '';
  document.getElementById('input-desc').value = page.description || '';
  document.getElementById('input-keywords').value = page.keywords || '';
  document.getElementById('input-canonical').value = page.canonical || `${currentDomain}/${page.filename === 'index.html' ? '' : page.filename}`;
  document.getElementById('input-robots').value = page.robots || 'index, follow';

  document.getElementById('input-og-title').value = page.ogTitle || '';
  document.getElementById('input-og-desc').value = page.ogDescription || '';
  document.getElementById('input-og-image').value = page.ogImage || `${currentDomain}/assets/images/curafy-logo-mark.png`;
  document.getElementById('input-og-type').value = page.ogType || 'website';
  document.getElementById('input-twitter-card').value = page.twitterCard || 'summary_large_image';

  if (page.schemas && page.schemas.length > 0 && !page.schemas[0].error) {
    document.getElementById('input-schema-json').value = JSON.stringify(page.schemas.length === 1 ? page.schemas[0] : page.schemas, null, 2);
  } else {
    document.getElementById('input-schema-json').value = '';
  }

  renderPageAudit(page);
  onMetaChange();
  onSocialChange();
  refreshIcons();
}

// Reactive Updates
function onMetaChange() {
  const title = document.getElementById('input-title').value;
  const desc = document.getElementById('input-desc').value;
  const keywords = document.getElementById('input-keywords').value;
  const canonical = document.getElementById('input-canonical').value;
  const page = pagesData[activeIndex];

  const tLen = title.length;
  document.getElementById('title-char-count').textContent = tLen;
  const tBar = document.getElementById('title-char-bar');
  const tStatus = document.getElementById('title-status-label');
  tBar.style.width = `${Math.min(100, Math.round((tLen / 60) * 100))}%`;

  if (tLen >= 45 && tLen <= 65) {
    tBar.className = 'h-full bg-emerald-400 transition-all duration-300';
    tStatus.textContent = 'Ideal length';
    tStatus.className = 'text-[11px] font-medium text-emerald-400 shrink-0';
  } else if (tLen > 65) {
    tBar.className = 'h-full bg-rose-400 transition-all duration-300';
    tStatus.textContent = 'Too long (truncated)';
    tStatus.className = 'text-[11px] font-medium text-rose-400 shrink-0';
  } else {
    tBar.className = 'h-full bg-amber-400 transition-all duration-300';
    tStatus.textContent = 'A bit short';
    tStatus.className = 'text-[11px] font-medium text-amber-400 shrink-0';
  }

  const dLen = desc.length;
  document.getElementById('desc-char-count').textContent = dLen;
  const dBar = document.getElementById('desc-char-bar');
  const dStatus = document.getElementById('desc-status-label');
  dBar.style.width = `${Math.min(100, Math.round((dLen / 160) * 100))}%`;

  if (dLen >= 120 && dLen <= 165) {
    dBar.className = 'h-full bg-emerald-400 transition-all duration-300';
    dStatus.textContent = 'Optimal length';
    dStatus.className = 'text-[11px] font-medium text-emerald-400 shrink-0';
  } else if (dLen > 165) {
    dBar.className = 'h-full bg-rose-400 transition-all duration-300';
    dStatus.textContent = 'Too long (cut off)';
    dStatus.className = 'text-[11px] font-medium text-rose-400 shrink-0';
  } else {
    dBar.className = 'h-full bg-amber-400 transition-all duration-300';
    dStatus.textContent = 'A bit short';
    dStatus.className = 'text-[11px] font-medium text-amber-400 shrink-0';
  }

  renderKeywordChips(keywords);
  checkKeywordPlacement(keywords, title, desc, page);

  const displayUrl = canonical || `${currentDomain}/${page ? page.filename : ''}`;
  const displayTitle = title || 'Curafy Digitech | Digital Marketing';
  const displayDesc = desc || 'Discover Curafy Digitech digital marketing strategies and performance solutions.';

  document.getElementById('quick-serp-url').textContent = displayUrl;
  document.getElementById('quick-serp-title').textContent = displayTitle;
  document.getElementById('quick-serp-desc').textContent = displayDesc;

  document.getElementById('serp-preview-url').textContent = displayUrl;
  document.getElementById('serp-preview-title').textContent = displayTitle;
  document.getElementById('serp-preview-desc').textContent = displayDesc;

  document.getElementById('serp-preview-mobile-url').textContent = displayUrl;
  document.getElementById('serp-preview-mobile-title').textContent = displayTitle;
  document.getElementById('serp-preview-mobile-desc').textContent = displayDesc;

  const estPixels = Math.round(tLen * 8.8);
  document.getElementById('title-pixels-est').textContent = `~${estPixels}px / 600px max`;
  const pixelBar = document.getElementById('title-pixels-bar');
  pixelBar.style.width = `${Math.min(100, Math.round((estPixels / 600) * 100))}%`;
  const riskBadge = document.getElementById('serp-risk-badge');
  if (estPixels > 580) {
    riskBadge.textContent = 'High Truncation Risk';
    riskBadge.className = 'text-rose-400 font-bold';
    pixelBar.className = 'h-full bg-rose-500 transition-all duration-300';
  } else {
    riskBadge.textContent = 'Low Risk (Safe)';
    riskBadge.className = 'text-emerald-400 font-bold';
    pixelBar.className = 'h-full bg-emerald-500 transition-all duration-300';
  }
}

function onSocialChange() {
  const ogTitle = document.getElementById('input-og-title').value || document.getElementById('input-title').value || 'Curafy Digitech';
  const ogDesc = document.getElementById('input-og-desc').value || document.getElementById('input-desc').value || 'Digital Marketing & Growth Partner';
  const ogImg = document.getElementById('input-og-image').value || '/assets/images/curafy-logo-mark.png';

  document.getElementById('og-preview-title').textContent = ogTitle;
  document.getElementById('og-preview-desc').textContent = ogDesc;
  document.getElementById('og-preview-img').src = ogImg;

  document.getElementById('twitter-preview-title').textContent = ogTitle;
  document.getElementById('twitter-preview-desc').textContent = ogDesc;
  document.getElementById('twitter-preview-img').src = ogImg;
}

function setSampleOgImage() {
  document.getElementById('input-og-image').value = `${currentDomain}/assets/images/curafy-logo-mark.png`;
  onSocialChange();
  showToast('Set OG Image to Curafy Logo Mark', 'info');
}

function autoGenerateCanonical() {
  const page = pagesData[activeIndex];
  if (!page) return;
  const path = page.filename === 'index.html' ? '' : page.filename;
  document.getElementById('input-canonical').value = `${currentDomain}/${path}`;
  onMetaChange();
  showToast('Canonical URL auto-generated', 'info');
}

function renderKeywordChips(keywordsStr) {
  const container = document.getElementById('keyword-chips-container');
  if (!keywordsStr.trim()) {
    container.innerHTML = '<span class="text-slate-500 text-xs italic">No focus keywords entered yet</span>';
    return;
  }
  const chips = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
  container.innerHTML = chips.map(chip => `
    <span class="px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium flex items-center gap-1">
      <i data-lucide="tag" class="w-3 h-3"></i>
      <span>${escapeHtml(chip)}</span>
    </span>
  `).join('');
  refreshIcons();
}

function checkKeywordPlacement(keywordsStr, title, desc, page) {
  const firstKw = keywordsStr.split(',')[0]?.trim().toLowerCase();
  const kwTitleEl = document.getElementById('kw-check-title');
  const kwDescEl = document.getElementById('kw-check-desc');
  const kwH1El = document.getElementById('kw-check-h1');
  const kwUrlEl = document.getElementById('kw-check-url');

  if (!firstKw) {
    [kwTitleEl, kwDescEl, kwH1El, kwUrlEl].forEach(el => {
      el.textContent = '—';
      el.className = 'font-semibold text-slate-500';
    });
    return;
  }

  kwTitleEl.textContent = title.toLowerCase().includes(firstKw) ? '✓ Present' : '✕ Missing';
  kwTitleEl.className = title.toLowerCase().includes(firstKw) ? 'font-semibold text-emerald-400' : 'font-semibold text-rose-400';

  kwDescEl.textContent = desc.toLowerCase().includes(firstKw) ? '✓ Present' : '✕ Missing';
  kwDescEl.className = desc.toLowerCase().includes(firstKw) ? 'font-semibold text-emerald-400' : 'font-semibold text-rose-400';

  const h1 = page && page.contentAnalysis && page.contentAnalysis.h1s && page.contentAnalysis.h1s[0] ? page.contentAnalysis.h1s[0].toLowerCase() : '';
  kwH1El.textContent = h1.includes(firstKw) ? '✓ Present' : '✕ Missing';
  kwH1El.className = h1.includes(firstKw) ? 'font-semibold text-emerald-400' : 'font-semibold text-rose-400';

  const slug = page ? page.filename.toLowerCase() : '';
  kwUrlEl.textContent = slug.includes(firstKw.replace(/\s+/g, '-')) ? '✓ Present' : '✕ Missing';
  kwUrlEl.className = slug.includes(firstKw.replace(/\s+/g, '-')) ? 'font-semibold text-emerald-400' : 'font-semibold text-slate-400';
}

function renderPageAudit(page) {
  const auditContainer = document.getElementById('audit-checklist-container');
  const scorePill = document.getElementById('audit-score-pill');
  const checks = page.checks || [];

  scorePill.textContent = `${page.seoScore || 0} / 100`;
  scorePill.className = `score-badge px-3 py-1 text-sm ${
    page.seoScore >= 80 ? 'score-high' : page.seoScore >= 60 ? 'score-med' : 'score-low'
  }`;

  auditContainer.innerHTML = checks.map(c => {
    let icon = 'check-circle';
    let iconClass = 'text-emerald-400';
    let bgClass = 'bg-curafy-surface border-curafy-border';

    if (!c.passed) {
      if (c.type === 'critical') {
        icon = 'x-circle';
        iconClass = 'text-rose-400';
        bgClass = 'bg-rose-950/20 border-rose-500/30';
      } else if (c.type === 'warning') {
        icon = 'alert-triangle';
        iconClass = 'text-amber-400';
        bgClass = 'bg-amber-950/20 border-amber-500/30';
      } else {
        icon = 'info';
        iconClass = 'text-blue-400';
      }
    }

    return `
      <div class="flex items-start gap-3 p-3 rounded-lg border ${bgClass} text-xs">
        <i data-lucide="${icon}" class="w-4 h-4 mt-0.5 ${iconClass} shrink-0"></i>
        <div class="flex-1">
          <span class="${c.passed ? 'text-slate-200' : 'text-slate-100 font-medium'}">${c.message}</span>
        </div>
      </div>
    `;
  }).join('');

  const ca = page.contentAnalysis || {};
  document.getElementById('audit-stat-words').textContent = `${ca.wordCount || 0} words`;
  document.getElementById('audit-stat-images').textContent = `${ca.totalImages || 0}`;
  document.getElementById('audit-stat-h1s').textContent = `${(ca.h1s || []).length}`;
  document.getElementById('audit-stat-h2s').textContent = `${ca.h2Count || 0}`;
  document.getElementById('audit-stat-h3s').textContent = `${ca.h3Count || 0}`;
  document.getElementById('audit-h1-text').textContent = (ca.h1s && ca.h1s.length > 0) ? ca.h1s[0] : 'No <h1> detected in HTML';

  const missingImgs = ca.missingAltImages || [];
  const imgListContainer = document.getElementById('missing-alt-images-list');
  const imgBadge = document.getElementById('image-audit-badge');

  if (missingImgs.length === 0) {
    imgBadge.textContent = 'All Good (100%)';
    imgBadge.className = 'text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    imgListContainer.innerHTML = '<div class="text-emerald-400 flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5"></i> All &lt;img&gt; tags have descriptive alt attributes!</div>';
  } else {
    imgBadge.textContent = `${missingImgs.length} Missing`;
    imgBadge.className = 'text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30';
    imgListContainer.innerHTML = `
      <p class="text-rose-300 font-medium mb-1">Search engines use image alt text to understand context. Missing in:</p>
      <div class="space-y-1 max-h-36 overflow-y-auto">
        ${missingImgs.map(src => `
          <div class="p-1.5 rounded bg-curafy-surface border border-curafy-border font-mono text-[11px] text-slate-300 truncate">
            &lt;img src="${escapeHtml(src)}"&gt;
          </div>
        `).join('')}
      </div>
    `;
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('border-cyan-400', 'text-cyan-400');
    b.classList.add('border-transparent', 'text-slate-400');
  });

  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-slate-400');
    activeBtn.classList.add('border-cyan-400', 'text-cyan-400');
  }

  refreshIcons();
}

function setSerpDevice(device) {
  serpDevice = device;
  const desktopContainer = document.getElementById('serp-desktop-container');
  const mobileContainer = document.getElementById('serp-mobile-container');
  const btnDesktop = document.getElementById('btn-serp-desktop');
  const btnMobile = document.getElementById('btn-serp-mobile');

  if (device === 'desktop') {
    desktopContainer.classList.remove('hidden');
    mobileContainer.classList.add('hidden');
    btnDesktop.className = 'px-3 py-1.5 rounded-md text-xs font-semibold bg-curafy-blue text-white flex items-center gap-1.5 transition';
    btnMobile.className = 'px-3 py-1.5 rounded-md text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition';
  } else {
    desktopContainer.classList.add('hidden');
    mobileContainer.classList.remove('hidden');
    btnMobile.className = 'px-3 py-1.5 rounded-md text-xs font-semibold bg-curafy-blue text-white flex items-center gap-1.5 transition';
    btnDesktop.className = 'px-3 py-1.5 rounded-md text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition';
  }
}

// Generate updated HTML string in-browser
function generateUpdatedHtml(originalHtml, data) {
  let html = originalHtml;

  // Title
  if (data.title !== undefined) {
    if (/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
      html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(data.title)}</title>`);
    } else {
      html = html.replace(/<head[^>]*>/i, `$& \n  <title>${escapeHtml(data.title)}</title>`);
    }
  }

  // Remove existing
  html = html.replace(/<meta\s+[^>]*?name=["']description["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<meta\s+[^>]*?name=["']keywords["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<meta\s+[^>]*?name=["']robots["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<link\s+[^>]*?rel=["']canonical["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<meta\s+[^>]*?(?:property|name)=["']og:[^"']*["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<meta\s+[^>]*?(?:property|name)=["']twitter:[^"']*["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<!--\s*SEO\s*&\s*Open\s*Graph\s*Meta\s*Tags[\s\S]*?<!--\s*End\s*SEO\s*Tags\s*-->\r?\n?/gi, '');

  const seoLines = [
    `  <!-- SEO & Open Graph Meta Tags (Managed by Curafy SEO Admin) -->`
  ];
  if (data.description) seoLines.push(`  <meta name="description" content="${escapeAttr(data.description)}">`);
  if (data.keywords) seoLines.push(`  <meta name="keywords" content="${escapeAttr(data.keywords)}">`);
  if (data.robots) seoLines.push(`  <meta name="robots" content="${escapeAttr(data.robots)}">`);
  if (data.canonical) seoLines.push(`  <link rel="canonical" href="${escapeAttr(data.canonical)}">`);

  const ogTitle = data.ogTitle || data.title || '';
  const ogDesc = data.ogDescription || data.description || '';
  const ogImg = data.ogImage || '';
  const ogUrl = data.ogUrl || data.canonical || '';
  const ogType = data.ogType || 'website';
  const ogSite = data.ogSiteName || 'Curafy Digitech';

  if (ogTitle) seoLines.push(`  <meta property="og:title" content="${escapeAttr(ogTitle)}">`);
  if (ogDesc) seoLines.push(`  <meta property="og:description" content="${escapeAttr(ogDesc)}">`);
  if (ogUrl) seoLines.push(`  <meta property="og:url" content="${escapeAttr(ogUrl)}">`);
  if (ogType) seoLines.push(`  <meta property="og:type" content="${escapeAttr(ogType)}">`);
  if (ogSite) seoLines.push(`  <meta property="og:site_name" content="${escapeAttr(ogSite)}">`);
  if (ogImg) seoLines.push(`  <meta property="og:image" content="${escapeAttr(ogImg)}">`);

  const twCard = data.twitterCard || 'summary_large_image';
  const twTitle = data.twitterTitle || ogTitle;
  const twDesc = data.twitterDescription || ogDesc;
  const twImg = data.twitterImage || ogImg;

  seoLines.push(`  <meta name="twitter:card" content="${escapeAttr(twCard)}">`);
  if (twTitle) seoLines.push(`  <meta name="twitter:title" content="${escapeAttr(twTitle)}">`);
  if (twDesc) seoLines.push(`  <meta name="twitter:description" content="${escapeAttr(twDesc)}">`);
  if (twImg) seoLines.push(`  <meta name="twitter:image" content="${escapeAttr(twImg)}">`);
  seoLines.push(`  <!-- End SEO Tags -->`);

  const seoBlock = seoLines.join('\n');
  if (/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/(<title[^>]*>[\s\S]*?<\/title>)/i, `$1\n${seoBlock}`);
  } else {
    html = html.replace(/(<head[^>]*>)/i, `$1\n${seoBlock}`);
  }

  // Schema
  html = html.replace(/<!--\s*Schema\.org\s*JSON-LD[\s\S]*?<\/script>\r?\n?/gi, '');
  html = html.replace(/<script\s+[^>]*?type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\r?\n?/gi, '');

  if (data.schemaJson && data.schemaJson.trim()) {
    let formattedSchema = data.schemaJson.trim();
    try {
      formattedSchema = JSON.stringify(JSON.parse(formattedSchema), null, 2);
    } catch (e) {}

    const schemaBlock = `  <!-- Schema.org JSON-LD (Managed by Curafy SEO Admin) -->\n  <script type="application/ld+json">\n${formattedSchema
      .split('\n')
      .map(line => '  ' + line)
      .join('\n')}\n  </script>`;
    
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${schemaBlock}\n</head>`);
    }
  }

  return html;
}

// SAVE ACTIVE PAGE (Local API vs Live GitHub Commit)
async function saveActivePageChanges() {
  const page = pagesData[activeIndex];
  if (!page) return;

  const btn = document.getElementById('btn-save-page');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Saving &amp; Syncing...</span>`;
  refreshIcons();

  const title = document.getElementById('input-title').value.trim();
  const description = document.getElementById('input-desc').value.trim();
  const keywords = document.getElementById('input-keywords').value.trim();
  const canonical = document.getElementById('input-canonical').value.trim();
  const robots = document.getElementById('input-robots').value;

  const ogTitle = document.getElementById('input-og-title').value.trim();
  const ogDescription = document.getElementById('input-og-desc').value.trim();
  const ogImage = document.getElementById('input-og-image').value.trim();
  const ogType = document.getElementById('input-og-type').value;
  const twitterCard = document.getElementById('input-twitter-card').value;

  const schemaJson = document.getElementById('input-schema-json').value.trim();

  if (schemaJson) {
    try {
      JSON.parse(schemaJson);
    } catch (e) {
      showToast('Schema JSON has syntax errors! Please fix before saving.', 'error');
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      refreshIcons();
      return;
    }
  }

  const payload = {
    filename: page.filename,
    title,
    description,
    keywords,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl: canonical,
    ogType,
    twitterCard,
    twitterTitle: ogTitle || title,
    twitterDescription: ogDescription || description,
    twitterImage: ogImage,
    schemaJson
  };

  try {
    if (isLocalMode) {
      // Local Node Server
      const res = await fetch('/api/pages/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update page');
      showToast(`✓ Applied SEO tags to ${page.filename}! Safe backup created in .seo_backups/`, 'success');
      pagesData[activeIndex] = json.page;
      selectPage(activeIndex);
      fetchPages();
    } else {
      // Live GitHub API Commit
      let token = getGithubToken();
      if (!token) {
        token = prompt('Please enter your GitHub Personal Access Token to commit changes to the live site:\n(You can also save it in Security Settings)');
        if (!token) {
          throw new Error('GitHub token required to save changes to the live website.');
        }
        localStorage.setItem('curafy_github_token', token.trim());
      }

      // 1. Get current file sha from GitHub API
      const fileInfoRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${page.filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!fileInfoRes.ok) {
        const errJson = await fileInfoRes.json();
        throw new Error(`GitHub API Error: ${errJson.message || fileInfoRes.statusText}`);
      }

      const fileInfo = await fileInfoRes.json();
      const currentSha = fileInfo.sha;
      const originalContent = decodeURIComponent(escape(atob(fileInfo.content.replace(/\s/g, ''))));

      // 2. Build updated HTML
      const newHtml = generateUpdatedHtml(originalContent, payload);

      // 3. Commit back to GitHub
      const commitRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${page.filename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `seo: update metadata for ${page.filename} via Curafy SEO Admin`,
          content: btoa(unescape(encodeURIComponent(newHtml))),
          sha: currentSha,
          branch: REPO_BRANCH
        })
      });

      if (!commitRes.ok) {
        const commitErr = await commitRes.json();
        throw new Error(`Commit failed: ${commitErr.message}`);
      }

      showToast(`✓ Successfully committed SEO updates for ${page.filename} to GitHub! GitHub Pages will update curafydigitech.com in ~45 seconds.`, 'success');
      page.rawHtml = newHtml;
      const updatedData = parseHtmlInBrowser(page.filename, newHtml);
      pagesData[activeIndex] = updatedData;
      selectPage(activeIndex);
    }
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    refreshIcons();
  }
}

// Preset Schemas
const SCHEMA_TEMPLATES = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Curafy Digitech",
    "alternateName": "Curafy Digital Performance Lab",
    "url": "https://www.curafydigitech.com",
    "logo": "https://www.curafydigitech.com/assets/images/curafy-logo-mark.png",
    "description": "Premier digital marketing and performance agency engineered for healthcare clinics, startups, and enterprises.",
    "email": "info@curafydigitech.com",
    "sameAs": [
      "https://www.facebook.com/curafydigitech",
      "https://www.instagram.com/curafydigitech",
      "https://www.linkedin.com/company/curafydigitech"
    ]
  },
  localBusiness: {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Curafy Digitech - Digital Growth Agency",
    "image": "https://www.curafydigitech.com/assets/images/curafy-logo-mark.png",
    "@id": "https://www.curafydigitech.com/#localbusiness",
    "url": "https://www.curafydigitech.com",
    "telephone": "+91-9876543210",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Curafy Headquarters",
      "addressLocality": "Jaipur",
      "addressRegion": "RJ",
      "postalCode": "302001",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  },
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Curafy Digitech",
    "url": "https://www.curafydigitech.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.curafydigitech.com/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  service: {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Digital Marketing & Performance SEO",
    "provider": {
      "@type": "Organization",
      "name": "Curafy Digitech",
      "url": "https://www.curafydigitech.com"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Agency Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "SEO & Local SEO Optimization" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Paid Ads & ROAS Management (Meta / Google)" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Healthcare & Clinic Growth Architecture" } }
      ]
    }
  },
  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What digital marketing services does Curafy Digitech offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Curafy Digitech provides end-to-end digital marketing solutions including search engine optimization (SEO), Meta & Google Ads management, social media marketing, high-converting website design, and specialized healthcare marketing."
        }
      },
      {
        "@type": "Question",
        "name": "How does Curafy Digitech help clinics and hospitals grow?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our healthcare division designs patient acquisition funnels, local Google Business Profile dominance, and HIPPA-compliant conversion strategies to maximize appointment bookings."
        }
      }
    ]
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.curafydigitech.com/" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://www.curafydigitech.com/services.html" }
    ]
  }
};

function applySchemaTemplate() {
  const key = document.getElementById('schema-template-select').value;
  const template = SCHEMA_TEMPLATES[key];
  if (!template) return;
  document.getElementById('input-schema-json').value = JSON.stringify(template, null, 2);
  validateAndFormatSchemaJson();
  showToast(`Applied ${key} schema preset`, 'info');
}

function validateAndFormatSchemaJson() {
  const textarea = document.getElementById('input-schema-json');
  const msg = document.getElementById('schema-validation-msg');
  const raw = textarea.value.trim();

  if (!raw) {
    msg.innerHTML = '<span class="text-slate-400">Schema is empty (no JSON-LD will be injected).</span>';
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    textarea.value = JSON.stringify(parsed, null, 2);
    msg.innerHTML = '<span class="text-emerald-400 flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> Valid Schema.org JSON structure!</span>';
    refreshIcons();
  } catch (err) {
    msg.innerHTML = `<span class="text-rose-400 flex items-center gap-1"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> JSON Syntax Error: ${escapeHtml(err.message)}</span>`;
    refreshIcons();
  }
}

function clearSchemaJson() {
  document.getElementById('input-schema-json').value = '';
  validateAndFormatSchemaJson();
}

// Sitemap Modal
async function openSitemapModal() {
  document.getElementById('modal-sitemap').classList.remove('hidden');
  try {
    const res = await fetch('/sitemap.xml');
    if (res.ok) {
      document.getElementById('sitemap-xml-editor').value = await res.text();
    } else {
      generateFreshSitemap();
    }
  } catch (e) {
    generateFreshSitemap();
  }
  refreshIcons();
}

function closeSitemapModal() {
  document.getElementById('modal-sitemap').classList.add('hidden');
}

async function generateFreshSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const priorityMap = {
    'index.html': { priority: '1.0', changefreq: 'weekly', loc: '/' },
    'services.html': { priority: '0.9', changefreq: 'weekly', loc: '/services.html' },
    'healthcare.html': { priority: '0.9', changefreq: 'weekly', loc: '/healthcare.html' },
    'landing.html': { priority: '0.8', changefreq: 'weekly', loc: '/landing.html' },
    'case-studies.html': { priority: '0.8', changefreq: 'monthly', loc: '/case-studies.html' },
    'about.html': { priority: '0.8', changefreq: 'monthly', loc: '/about.html' },
    'contact.html': { priority: '0.8', changefreq: 'monthly', loc: '/contact.html' },
    'thank-you.html': { priority: '0.3', changefreq: 'yearly', loc: '/thank-you.html' }
  };

  const xmlEntries = PAGE_FILES.map(fn => {
    const config = priorityMap[fn] || { priority: '0.6', changefreq: 'monthly', loc: `/${fn}` };
    return `  <url>
    <loc>${currentDomain}${config.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${config.changefreq}</changefreq>
    <priority>${config.priority}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries.join('\n')}
</urlset>
`;
  document.getElementById('sitemap-xml-editor').value = xml;
  showToast('Generated fresh XML sitemap!', 'success');
}

async function saveSitemapXml() {
  const content = document.getElementById('sitemap-xml-editor').value;
  try {
    if (isLocalMode) {
      const res = await fetch('/api/sitemap/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } else {
      const token = getGithubToken();
      if (!token) throw new Error('GitHub token required to save live sitemap.xml.');
      
      const fileInfoRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/sitemap.xml`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const currentSha = fileInfoRes.ok ? (await fileInfoRes.json()).sha : undefined;

      await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/sitemap.xml`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'seo: update sitemap.xml via Curafy SEO Admin',
          content: btoa(unescape(encodeURIComponent(content))),
          sha: currentSha,
          branch: REPO_BRANCH
        })
      });
    }
    showToast('sitemap.xml saved successfully!', 'success');
    closeSitemapModal();
  } catch (e) {
    showToast(`Error saving sitemap: ${e.message}`, 'error');
  }
}

// Robots Modal
async function openRobotsModal() {
  document.getElementById('modal-robots').classList.remove('hidden');
  try {
    const res = await fetch('/robots.txt');
    if (res.ok) {
      document.getElementById('robots-txt-editor').value = await res.text();
    } else {
      document.getElementById('robots-txt-editor').value = `# Curafy Digitech - robots.txt\nUser-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /.seo_backups/\nDisallow: /thank-you.html\n\n# Sitemaps\nSitemap: ${currentDomain}/sitemap.xml\n`;
    }
  } catch (e) {
    document.getElementById('robots-txt-editor').value = `# Curafy Digitech - robots.txt\nUser-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${currentDomain}/sitemap.xml\n`;
  }
  refreshIcons();
}

function closeRobotsModal() {
  document.getElementById('modal-robots').classList.add('hidden');
}

async function saveRobotsTxt() {
  const content = document.getElementById('robots-txt-editor').value;
  try {
    if (isLocalMode) {
      const res = await fetch('/api/robots/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } else {
      const token = getGithubToken();
      if (!token) throw new Error('GitHub token required to save robots.txt.');
      const fileInfoRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/robots.txt`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const currentSha = fileInfoRes.ok ? (await fileInfoRes.json()).sha : undefined;

      await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/robots.txt`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'seo: update robots.txt via Curafy SEO Admin',
          content: btoa(unescape(encodeURIComponent(content))),
          sha: currentSha,
          branch: REPO_BRANCH
        })
      });
    }
    showToast('robots.txt saved successfully!', 'success');
    closeRobotsModal();
  } catch (e) {
    showToast(`Error saving robots.txt: ${e.message}`, 'error');
  }
}

// Backups Modal
async function openBackupsModal() {
  const page = pagesData[activeIndex];
  if (!page) return;

  document.getElementById('modal-backups').classList.remove('hidden');
  const container = document.getElementById('backups-list-container');
  container.innerHTML = `<div class="text-xs text-slate-400">Loading backups for ${page.filename}...</div>`;

  if (isLocalMode) {
    try {
      const res = await fetch(`/api/backups?page=${encodeURIComponent(page.filename)}`);
      const json = await res.json();
      const backups = json.backups || [];

      if (backups.length === 0) {
        container.innerHTML = `<div class="p-4 rounded-xl bg-curafy-surface border border-curafy-border text-center text-xs text-slate-400">No backups created yet for ${page.filename}. Backups are saved automatically upon clicking "Save & Apply".</div>`;
      } else {
        container.innerHTML = backups.map(b => `
          <div class="flex items-center justify-between p-3 rounded-xl bg-curafy-surface border border-curafy-border text-xs">
            <div class="flex items-center gap-2 truncate mr-2">
              <i data-lucide="archive" class="w-4 h-4 text-cyan-400 shrink-0"></i>
              <span class="font-mono text-slate-200 truncate">${escapeHtml(b)}</span>
            </div>
            <button onclick="restoreBackup('${b}', '${page.filename}')" class="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-semibold text-[11px] shrink-0 transition">
              Revert to this
            </button>
          </div>
        `).join('');
        refreshIcons();
      }
    } catch (e) {
      container.innerHTML = `<div class="text-xs text-rose-400">Failed to load backups: ${e.message}</div>`;
    }
  } else {
    // In GitHub Pages live mode, GitHub commits are the version history!
    container.innerHTML = `
      <div class="p-4 rounded-xl bg-curafy-surface border border-curafy-border text-xs space-y-2">
        <p class="text-slate-300 font-semibold">Git Commit History</p>
        <p class="text-slate-400">On your live website, every change is tracked as a Git commit in your repository.</p>
        <a href="https://github.com/${REPO_OWNER}/${REPO_NAME}/commits/${REPO_BRANCH}/${page.filename}" target="_blank" class="inline-flex items-center gap-1.5 text-cyan-400 hover:underline font-semibold mt-1">
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          <span>View ${page.filename} Version History on GitHub →</span>
        </a>
      </div>
    `;
    refreshIcons();
  }
}

function closeBackupsModal() {
  document.getElementById('modal-backups').classList.add('hidden');
}

async function restoreBackup(backupFileName, targetPage) {
  if (!confirm(`Revert ${targetPage} to backup "${backupFileName}"?`)) return;

  try {
    const res = await fetch('/api/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupFileName, targetPage })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    showToast(`✓ Reverted ${targetPage} successfully!`, 'success');
    closeBackupsModal();
    fetchPages();
  } catch (e) {
    showToast(`Restore failed: ${e.message}`, 'error');
  }
}

// Toast Helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  let bgClass = 'bg-slate-900 text-white border border-slate-700';
  let iconName = 'check-circle';

  if (type === 'success') {
    bgClass = 'bg-emerald-950 text-emerald-200 border border-emerald-500/40';
    iconName = 'check-circle-2';
  } else if (type === 'error') {
    bgClass = 'bg-rose-950 text-rose-200 border border-rose-500/40';
    iconName = 'alert-octagon';
  } else if (type === 'info') {
    bgClass = 'bg-blue-950 text-blue-200 border border-blue-500/40';
    iconName = 'info';
  }

  toast.className = `toast ${bgClass}`;
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  refreshIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// ================= BLOG POSTS MANAGER =================

let allAdminBlogs = [];

async function loadAdminBlogs() {
  const container = document.getElementById('admin-blogs-list');
  if (!container) return;

  try {
    if (isLocalMode) {
      const res = await fetch('/api/blogs');
      const json = await res.json();
      allAdminBlogs = json.blogs || [];
    } else {
      const res = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/assets/data/blogs.json?t=${Date.now()}`);
      if (res.ok) {
        allAdminBlogs = await res.json();
      } else {
        allAdminBlogs = [];
      }
    }
    renderAdminBlogsList();
  } catch (err) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-rose-400">Error loading blogs: ${escapeHtml(err.message)}</div>`;
  }
}

function renderAdminBlogsList() {
  const container = document.getElementById('admin-blogs-list');
  if (!container) return;

  if (allAdminBlogs.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-curafy-surface border border-curafy-border rounded-xl">
        <i data-lucide="newspaper" class="w-8 h-8 text-slate-500 mx-auto mb-2"></i>
        <h4 class="font-heading font-semibold text-sm text-slate-300">No Articles Published Yet</h4>
        <p class="text-xs text-slate-500 mt-1">Click "Write New Blog Post" above to publish your first article.</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  container.innerHTML = allAdminBlogs.map(b => {
    return `
      <div class="p-4 rounded-xl bg-curafy-surface border border-curafy-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-600 transition">
        <div class="flex items-center gap-3.5 min-w-0">
          <img src="${escapeHtml(b.image || '/assets/images/curafy-logo-mark.png')}" alt="Cover" class="w-16 h-14 rounded-lg object-cover border border-curafy-border shrink-0 bg-slate-900" onerror="this.src='/assets/images/curafy-logo-mark.png'">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-cyan-500/30">
                ${escapeHtml(b.category || 'General')}
              </span>
              ${b.featured ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">★ Featured</span>' : ''}
              <span class="text-[11px] text-slate-400">${escapeHtml(b.date || '')}</span>
            </div>
            <h4 class="font-heading font-bold text-sm text-white truncate max-w-md sm:max-w-lg">${escapeHtml(b.title)}</h4>
            <div class="text-[11px] text-slate-400 font-mono truncate">slug: /blog-post.html?slug=${escapeHtml(b.slug)}</div>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <a href="/blog-post.html?slug=${encodeURIComponent(b.slug)}" target="_blank" class="p-2 rounded-lg bg-curafy-card hover:bg-slate-800 text-slate-300 hover:text-cyan-400 text-xs transition" title="Preview Article">
            <i data-lucide="external-link" class="w-4 h-4"></i>
          </a>
          <button type="button" onclick="openBlogEditorModal('${b.id}')" class="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white font-semibold text-xs transition flex items-center gap-1">
            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            <span>Edit</span>
          </button>
          <button type="button" onclick="deleteBlogPost('${b.id}')" class="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white text-xs transition" title="Delete Article">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  refreshIcons();
}

function openBlogEditorModal(blogId) {
  const modal = document.getElementById('modal-blog-editor');
  const heading = document.getElementById('blog-modal-heading');
  const previewBox = document.getElementById('blog-image-preview-box');

  if (blogId) {
    const post = allAdminBlogs.find(b => String(b.id) === String(blogId));
    if (!post) return;

    heading.textContent = 'Edit Blog Article';
    document.getElementById('blog-edit-id').value = post.id;
    document.getElementById('blog-input-title').value = post.title || '';
    document.getElementById('blog-input-slug').value = post.slug || '';
    document.getElementById('blog-input-category').value = post.category || 'Healthcare Marketing';
    document.getElementById('blog-input-author').value = post.author || 'Curafy Growth Team';
    document.getElementById('blog-input-readtime').value = post.readTime || '5 min read';
    document.getElementById('blog-input-image').value = post.image || '';
    document.getElementById('blog-input-excerpt').value = post.excerpt || '';
    document.getElementById('blog-input-featured').checked = Boolean(post.featured);
    document.getElementById('blog-input-content').value = post.content || '';

    if (post.image) {
      previewBox.classList.remove('hidden');
      document.getElementById('blog-image-preview-img').src = post.image;
    } else {
      previewBox.classList.add('hidden');
    }
  } else {
    heading.textContent = 'Create New Blog Article';
    document.getElementById('blog-edit-id').value = '';
    document.getElementById('blog-input-title').value = '';
    document.getElementById('blog-input-slug').value = '';
    document.getElementById('blog-input-category').value = 'Healthcare Marketing';
    document.getElementById('blog-input-author').value = 'Curafy Editorial Team';
    document.getElementById('blog-input-readtime').value = '5 min read';
    document.getElementById('blog-input-image').value = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';
    document.getElementById('blog-input-excerpt').value = '';
    document.getElementById('blog-input-featured').checked = false;
    document.getElementById('blog-input-content').value = '<p class="lead text-lg text-slate-700 font-medium leading-relaxed mb-6">Write your opening hook here...</p>\n\n<h2>1. First Key Strategy</h2>\n<p>Explain your insight and framework in detail...</p>\n\n<div class="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 mb-6">\n  <h4 class="font-bold mb-1">Growth Insight</h4>\n  <p class="text-sm">Highlight key takeaway or actionable metric here.</p>\n</div>';

    previewBox.classList.remove('hidden');
    document.getElementById('blog-image-preview-img').src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';
  }

  modal.classList.remove('hidden');
  refreshIcons();
}

function closeBlogEditorModal() {
  document.getElementById('modal-blog-editor').classList.add('hidden');
}

function onBlogTitleInput() {
  const editId = document.getElementById('blog-edit-id').value;
  const slugInput = document.getElementById('blog-input-slug');
  const title = document.getElementById('blog-input-title').value;

  if (!editId || !slugInput.value.trim()) {
    slugInput.value = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}

function onBlogImageChange() {
  const imgUrl = document.getElementById('blog-input-image').value.trim();
  const box = document.getElementById('blog-image-preview-box');
  const img = document.getElementById('blog-image-preview-img');
  if (imgUrl) {
    box.classList.remove('hidden');
    img.src = imgUrl;
  } else {
    box.classList.add('hidden');
  }
}

function setSampleBlogImage() {
  const sample = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';
  document.getElementById('blog-input-image').value = sample;
  onBlogImageChange();
}

function insertContentTag(type) {
  const textarea = document.getElementById('blog-input-content');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end) || 'Sample text';
  let insert = '';

  if (type === 'h2') insert = `<h2>${selected}</h2>\n`;
  else if (type === 'h3') insert = `<h3>${selected}</h3>\n`;
  else if (type === 'p') insert = `<p>${selected}</p>\n`;
  else if (type === 'ul') insert = `<ul class="list-disc pl-6 space-y-2 mb-6 text-slate-700">\n  <li>${selected}</li>\n  <li>Second key point</li>\n</ul>\n`;
  else if (type === 'tip') insert = `<div class="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 mb-6">\n  <h4 class="font-bold mb-1">Growth Pro Tip</h4>\n  <p class="text-sm">${selected}</p>\n</div>\n`;

  textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
  textarea.focus();
}

async function saveBlogPost() {
  const btn = document.getElementById('btn-publish-blog');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Publishing...</span>`;
  refreshIcons();

  const editId = document.getElementById('blog-edit-id').value;
  const title = document.getElementById('blog-input-title').value.trim();
  const slug = document.getElementById('blog-input-slug').value.trim();
  const category = document.getElementById('blog-input-category').value;
  const author = document.getElementById('blog-input-author').value.trim() || 'Curafy Editorial Team';
  const readTime = document.getElementById('blog-input-readtime').value.trim() || '5 min read';
  const image = document.getElementById('blog-input-image').value.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';
  const excerpt = document.getElementById('blog-input-excerpt').value.trim();
  const featured = document.getElementById('blog-input-featured').checked;
  const content = document.getElementById('blog-input-content').value.trim();

  if (!title || !slug || !content) {
    showToast('Please fill in Title, Slug, and Content!', 'error');
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    refreshIcons();
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  if (featured) {
    allAdminBlogs.forEach(b => { b.featured = false; });
  }

  if (editId) {
    const idx = allAdminBlogs.findIndex(b => String(b.id) === String(editId));
    if (idx !== -1) {
      allAdminBlogs[idx] = {
        ...allAdminBlogs[idx],
        title,
        slug,
        category,
        author,
        readTime,
        image,
        excerpt,
        featured,
        content
      };
    }
  } else {
    const newId = String(Date.now());
    allAdminBlogs.unshift({
      id: newId,
      slug,
      title,
      category,
      date: dateStr,
      readTime,
      author,
      authorAvatar: 'assets/images/curafy-logo-mark.png',
      image,
      excerpt: excerpt || title,
      featured,
      content
    });
  }

  try {
    if (isLocalMode) {
      const res = await fetch('/api/blogs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogs: allAdminBlogs })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } else {
      let token = getGithubToken();
      if (!token) {
        token = prompt('Enter your GitHub Personal Access Token to commit the new blog post to the live site:');
        if (!token) throw new Error('GitHub Token required to save live.');
        localStorage.setItem('curafy_github_token', token.trim());
      }

      const fileInfoRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/assets/data/blogs.json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const currentSha = fileInfoRes.ok ? (await fileInfoRes.json()).sha : undefined;

      const commitRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/assets/data/blogs.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `blog: publish/update article "${title}" via Curafy Admin`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(allAdminBlogs, null, 2)))),
          sha: currentSha,
          branch: REPO_BRANCH
        })
      });

      if (!commitRes.ok) {
        const err = await commitRes.json();
        throw new Error(err.message || 'GitHub commit failed');
      }
    }

    showToast(`✓ Published "${title}" to your website!`, 'success');
    closeBlogEditorModal();
    renderAdminBlogsList();
  } catch (err) {
    showToast(`Failed to publish blog: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    refreshIcons();
  }
}

async function deleteBlogPost(id) {
  const post = allAdminBlogs.find(b => String(b.id) === String(id));
  if (!post) return;
  if (!confirm(`Are you sure you want to delete article "${post.title}"?`)) return;

  allAdminBlogs = allAdminBlogs.filter(b => String(b.id) !== String(id));

  try {
    if (isLocalMode) {
      await fetch('/api/blogs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogs: allAdminBlogs })
      });
    } else {
      const token = getGithubToken();
      if (!token) throw new Error('GitHub token required.');
      const fileInfoRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/assets/data/blogs.json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const currentSha = fileInfoRes.ok ? (await fileInfoRes.json()).sha : undefined;

      await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/assets/data/blogs.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `blog: delete article "${post.title}" via Curafy Admin`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(allAdminBlogs, null, 2)))),
          sha: currentSha,
          branch: REPO_BRANCH
        })
      });
    }
    showToast('Article deleted successfully!', 'info');
    renderAdminBlogsList();
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

// Hook into tab switching: when tab-blogs is clicked, load blogs
const origSwitchTab = switchTab;
switchTab = function(tabId) {
  origSwitchTab(tabId);
  if (tabId === 'tab-blogs') {
    loadAdminBlogs();
  }
};
