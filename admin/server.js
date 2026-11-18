const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const ADMIN_DIR = __dirname;
const BACKUP_DIR = path.join(ROOT_DIR, '.seo_backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Read CNAME if available
function getSiteDomain() {
  const cnamePath = path.join(ROOT_DIR, 'CNAME');
  if (fs.existsSync(cnamePath)) {
    try {
      const cname = fs.readFileSync(cnamePath, 'utf8').trim();
      if (cname) return `https://www.${cname.replace(/^https?:\/\//, '').replace(/^www\./, '')}`;
    } catch (e) {}
  }
  return 'https://www.curafydigitech.com';
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function unescapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
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

// Meta Tag Extractor accurately handling both single and double quotes
function extractMetaTag(html, nameOrProp, attr = 'name') {
  const escaped = nameOrProp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Pattern 1: attr="..." content="..." or content='...'
  const regex1 = new RegExp(`<meta\\s+[^>]*?${attr}=["']${escaped}["'][^>]*?content=(?:"([^"]*)"|'([^']*)')[^>]*>`, 'i');
  // Pattern 2: content="..." or content='...' attr="..."
  const regex2 = new RegExp(`<meta\\s+[^>]*?content=(?:"([^"]*)"|'([^']*)')[^>]*?${attr}=["']${escaped}["'][^>]*>`, 'i');
  
  let match = html.match(regex1);
  if (match) return unescapeHtml(match[1] !== undefined ? match[1] : match[2]);

  match = html.match(regex2);
  if (match) return unescapeHtml(match[1] !== undefined ? match[1] : match[2]);

  return '';
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? unescapeHtml(m[1].trim()) : '';
}

function extractCanonical(html) {
  const m1 = html.match(/<link\s+[^>]*?rel=["']canonical["'][^>]*?href=(?:"([^"]*)"|'([^']*)')[^>]*>/i);
  if (m1) return unescapeHtml(m1[1] !== undefined ? m1[1] : m1[2]);

  const m2 = html.match(/<link\s+[^>]*?href=(?:"([^"]*)"|'([^']*)')[^>]*?rel=["']canonical["'][^>]*>/i);
  if (m2) return unescapeHtml(m2[1] !== undefined ? m2[1] : m2[2]);

  return '';
}

function extractJsonLd(html) {
  const schemas = [];
  const regex = /<script\s+[^>]*?type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      schemas.push(parsed);
    } catch (e) {
      schemas.push({ raw: match[1].trim(), error: 'Invalid JSON' });
    }
  }
  return schemas;
}

function analyzePageContent(html) {
  // Extract all H1s
  const h1Matches = [];
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let h1M;
  while ((h1M = h1Regex.exec(html)) !== null) {
    const text = h1M[1].replace(/<[^>]+>/g, '').trim();
    if (text) h1Matches.push(unescapeHtml(text));
  }

  // Count H2 and H3
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;

  // Image alt analysis (ignoring 1x1 tracking pixels like Meta/FB pixel)
  const imgRegex = /<img\s+([^>]*?)>/gi;
  let imgM;
  let totalImages = 0;
  const missingAltImages = [];
  while ((imgM = imgRegex.exec(html)) !== null) {
    const attrs = imgM[1];
    
    // Ignore tracking pixels
    if (/facebook\.com\/tr|google-analytics|display:\s*none|height=["']1["']|width=["']1["']/i.test(attrs)) {
      continue;
    }

    totalImages++;
    const srcMatch = attrs.match(/src=(?:"([^"]*)"|'([^']*)')/i);
    const src = srcMatch ? (srcMatch[1] || srcMatch[2]) : 'unknown';
    const altMatch = attrs.match(/alt=(?:"([^"]*)"|'([^']*)')/i);
    const altVal = altMatch ? (altMatch[1] || altMatch[2] || '') : '';
    
    if (!altMatch || !altVal.trim()) {
      missingAltImages.push(src);
    }
  }

  // Word count (approximate visible text)
  const cleanBody = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleanBody ? cleanBody.split(/\s+/).length : 0;

  return {
    h1s: h1Matches,
    h2Count,
    h3Count,
    totalImages,
    missingAltImages,
    wordCount: words
  };
}

function calculateSeoScore(pageData) {
  let score = 0;
  const checks = [];

  // 1. Title Check (max 15 pts)
  if (!pageData.title) {
    checks.push({ id: 'title', passed: false, type: 'critical', message: 'Missing <title> tag' });
  } else if (pageData.title.length < 30) {
    score += 8;
    checks.push({ id: 'title', passed: false, type: 'warning', message: `Title is too short (${pageData.title.length} chars). Aim for 50-60 characters.` });
  } else if (pageData.title.length > 65) {
    score += 10;
    checks.push({ id: 'title', passed: false, type: 'warning', message: `Title is slightly long (${pageData.title.length} chars). Google may truncate beyond 60-65 chars.` });
  } else {
    score += 15;
    checks.push({ id: 'title', passed: true, type: 'success', message: `Title length is optimal (${pageData.title.length} chars).` });
  }

  // 2. Meta Description Check (max 15 pts)
  if (!pageData.description) {
    checks.push({ id: 'desc', passed: false, type: 'critical', message: 'Missing Meta Description tag.' });
  } else if (pageData.description.length < 100) {
    score += 8;
    checks.push({ id: 'desc', passed: false, type: 'warning', message: `Meta description is short (${pageData.description.length} chars). Aim for 140-160 characters.` });
  } else if (pageData.description.length > 165) {
    score += 10;
    checks.push({ id: 'desc', passed: false, type: 'warning', message: `Meta description is long (${pageData.description.length} chars). Google typically clips beyond ~160 chars.` });
  } else {
    score += 15;
    checks.push({ id: 'desc', passed: true, type: 'success', message: `Meta description length is ideal (${pageData.description.length} chars).` });
  }

  // 3. Canonical URL Check (max 10 pts)
  if (pageData.canonical) {
    score += 10;
    checks.push({ id: 'canonical', passed: true, type: 'success', message: `Canonical link configured: ${pageData.canonical}` });
  } else {
    checks.push({ id: 'canonical', passed: false, type: 'warning', message: 'Missing canonical URL link tag.' });
  }

  // 4. H1 Structure (max 15 pts)
  if (!pageData.contentAnalysis.h1s || pageData.contentAnalysis.h1s.length === 0) {
    checks.push({ id: 'h1', passed: false, type: 'critical', message: 'No <h1> heading tag found on this page.' });
  } else if (pageData.contentAnalysis.h1s.length > 1) {
    score += 8;
    checks.push({ id: 'h1', passed: false, type: 'warning', message: `Multiple <h1> tags found (${pageData.contentAnalysis.h1s.length}). Best practice is exactly one <h1>.` });
  } else {
    score += 15;
    checks.push({ id: 'h1', passed: true, type: 'success', message: `One prominent <h1> found: "${pageData.contentAnalysis.h1s[0].substring(0, 45)}..."` });
  }

  // 5. Open Graph Meta Tags (max 15 pts)
  const hasOgTitle = Boolean(pageData.ogTitle || pageData.title);
  const hasOgDesc = Boolean(pageData.ogDescription || pageData.description);
  const hasOgImage = Boolean(pageData.ogImage);
  if (hasOgTitle && hasOgDesc && hasOgImage) {
    score += 15;
    checks.push({ id: 'og', passed: true, type: 'success', message: 'Open Graph (Facebook/LinkedIn) social cards are fully configured.' });
  } else if (hasOgTitle || hasOgDesc || hasOgImage) {
    score += 8;
    checks.push({ id: 'og', passed: false, type: 'warning', message: 'Incomplete Open Graph tags. Add an og:image and description.' });
  } else {
    checks.push({ id: 'og', passed: false, type: 'warning', message: 'No Open Graph social tags detected.' });
  }

  // 6. Twitter Card Tags (max 10 pts)
  if (pageData.twitterCard && (pageData.twitterTitle || pageData.title)) {
    score += 10;
    checks.push({ id: 'twitter', passed: true, type: 'success', message: `Twitter / X Card metadata configured (${pageData.twitterCard}).` });
  } else {
    checks.push({ id: 'twitter', passed: false, type: 'info', message: 'Twitter card tags not configured (will fall back to Open Graph).' });
  }

  // 7. Schema JSON-LD (max 10 pts)
  if (pageData.schemas && pageData.schemas.length > 0 && !pageData.schemas[0].error) {
    score += 10;
    checks.push({ id: 'schema', passed: true, type: 'success', message: `Structured Data (JSON-LD) detected (${pageData.schemas.length} schema block).` });
  } else {
    checks.push({ id: 'schema', passed: false, type: 'warning', message: 'No Schema.org JSON-LD structured data found.' });
  }

  // 8. Image Alt Tags (max 10 pts)
  if (pageData.contentAnalysis.totalImages > 0) {
    const missingCount = pageData.contentAnalysis.missingAltImages.length;
    if (missingCount === 0) {
      score += 10;
      checks.push({ id: 'images', passed: true, type: 'success', message: `All ${pageData.contentAnalysis.totalImages} content images have ALT attributes.` });
    } else {
      const pts = Math.max(0, Math.round(10 * (1 - missingCount / pageData.contentAnalysis.totalImages)));
      score += pts;
      checks.push({ id: 'images', passed: false, type: 'warning', message: `${missingCount} out of ${pageData.contentAnalysis.totalImages} images missing ALT attributes.` });
    }
  } else {
    score += 10;
    checks.push({ id: 'images', passed: true, type: 'info', message: 'No content images on this page.' });
  }

  return {
    score: Math.min(100, score),
    checks
  };
}

function parseHtmlFile(filename) {
  const filePath = path.join(ROOT_DIR, filename);
  if (!fs.existsSync(filePath)) return null;

  const html = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);

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

  const twitterCard = extractMetaTag(html, 'twitter:card', 'name') || extractMetaTag(html, 'twitter:card', 'property') || 'summary_large_image';
  const twitterTitle = extractMetaTag(html, 'twitter:title', 'name') || extractMetaTag(html, 'twitter:title', 'property');
  const twitterDescription = extractMetaTag(html, 'twitter:description', 'name') || extractMetaTag(html, 'twitter:description', 'property');
  const twitterImage = extractMetaTag(html, 'twitter:image', 'name') || extractMetaTag(html, 'twitter:image', 'property');

  const schemas = extractJsonLd(html);
  const contentAnalysis = analyzePageContent(html);

  const pageData = {
    filename,
    fileSize: `${(stats.size / 1024).toFixed(1)} KB`,
    lastModified: stats.mtime.toISOString(),
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

function getAllPages() {
  const files = fs.readdirSync(ROOT_DIR);
  const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('.'));
  
  htmlFiles.sort((a, b) => {
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    return a.localeCompare(b);
  });

  return htmlFiles.map(filename => parseHtmlFile(filename)).filter(Boolean);
}

function updateHtmlFile(filename, seoData) {
  const filePath = path.join(ROOT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filename} not found`);
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Create Timestamped Backup in .seo_backups/
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${filename.replace(/\.html$/, '')}.${timestamp}.bak.html`;
  fs.writeFileSync(path.join(BACKUP_DIR, backupFileName), html, 'utf8');

  // 2. Update <title>
  if (seoData.title !== undefined) {
    if (/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
      html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seoData.title)}</title>`);
    } else {
      html = html.replace(/<head[^>]*>/i, `$& \n  <title>${escapeHtml(seoData.title)}</title>`);
    }
  }

  // 3. Remove existing managed meta/canonical tags to prevent duplicates
  html = html.replace(/<meta\s+[^>]*?name=["']description["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<meta\s+[^>]*?name=["']keywords["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<meta\s+[^>]*?name=["']robots["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<link\s+[^>]*?rel=["']canonical["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<meta\s+[^>]*?(?:property|name)=["']og:[^"']*["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<meta\s+[^>]*?(?:property|name)=["']twitter:[^"']*["'][^>]*>\r?\n?/gi, '');
  html = html.replace(/<!--\s*SEO\s*&\s*Open\s*Graph\s*Meta\s*Tags[\s\S]*?<!--\s*End\s*SEO\s*Tags\s*-->\r?\n?/gi, '');

  // 4. Build new SEO meta block
  const seoLines = [
    `  <!-- SEO & Open Graph Meta Tags (Managed by Curafy SEO Admin) -->`
  ];

  if (seoData.description) {
    seoLines.push(`  <meta name="description" content="${escapeAttr(seoData.description)}">`);
  }
  if (seoData.keywords) {
    seoLines.push(`  <meta name="keywords" content="${escapeAttr(seoData.keywords)}">`);
  }
  if (seoData.robots) {
    seoLines.push(`  <meta name="robots" content="${escapeAttr(seoData.robots)}">`);
  }
  if (seoData.canonical) {
    seoLines.push(`  <link rel="canonical" href="${escapeAttr(seoData.canonical)}">`);
  }

  // Open Graph
  const ogTitle = seoData.ogTitle || seoData.title || '';
  const ogDesc = seoData.ogDescription || seoData.description || '';
  const ogImg = seoData.ogImage || '';
  const ogUrl = seoData.ogUrl || seoData.canonical || '';
  const ogType = seoData.ogType || 'website';
  const ogSite = seoData.ogSiteName || 'Curafy Digitech';

  if (ogTitle) seoLines.push(`  <meta property="og:title" content="${escapeAttr(ogTitle)}">`);
  if (ogDesc) seoLines.push(`  <meta property="og:description" content="${escapeAttr(ogDesc)}">`);
  if (ogUrl) seoLines.push(`  <meta property="og:url" content="${escapeAttr(ogUrl)}">`);
  if (ogType) seoLines.push(`  <meta property="og:type" content="${escapeAttr(ogType)}">`);
  if (ogSite) seoLines.push(`  <meta property="og:site_name" content="${escapeAttr(ogSite)}">`);
  if (ogImg) seoLines.push(`  <meta property="og:image" content="${escapeAttr(ogImg)}">`);

  // Twitter
  const twCard = seoData.twitterCard || 'summary_large_image';
  const twTitle = seoData.twitterTitle || ogTitle;
  const twDesc = seoData.twitterDescription || ogDesc;
  const twImg = seoData.twitterImage || ogImg;

  seoLines.push(`  <meta name="twitter:card" content="${escapeAttr(twCard)}">`);
  if (twTitle) seoLines.push(`  <meta name="twitter:title" content="${escapeAttr(twTitle)}">`);
  if (twDesc) seoLines.push(`  <meta name="twitter:description" content="${escapeAttr(twDesc)}">`);
  if (twImg) seoLines.push(`  <meta name="twitter:image" content="${escapeAttr(twImg)}">`);
  seoLines.push(`  <!-- End SEO Tags -->`);

  const seoBlock = seoLines.join('\n');

  // Insert SEO block right after <title>...</title>
  if (/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/(<title[^>]*>[\s\S]*?<\/title>)/i, `$1\n${seoBlock}`);
  } else {
    html = html.replace(/(<head[^>]*>)/i, `$1\n${seoBlock}`);
  }

  // 5. Handle JSON-LD Schema
  html = html.replace(/<!--\s*Schema\.org\s*JSON-LD[\s\S]*?<\/script>\r?\n?/gi, '');
  html = html.replace(/<script\s+[^>]*?type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\r?\n?/gi, '');

  if (seoData.schemaJson && seoData.schemaJson.trim()) {
    let formattedSchema = seoData.schemaJson.trim();
    try {
      const parsed = JSON.parse(formattedSchema);
      formattedSchema = JSON.stringify(parsed, null, 2);
    } catch (e) {}

    const schemaBlock = `  <!-- Schema.org JSON-LD (Managed by Curafy SEO Admin) -->\n  <script type="application/ld+json">\n${formattedSchema
      .split('\n')
      .map(line => '  ' + line)
      .join('\n')}\n  </script>`;
    
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${schemaBlock}\n</head>`);
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  return parseHtmlFile(filename);
}

function generateSitemap() {
  const domain = getSiteDomain();
  const pages = getAllPages();
  const today = new Date().toISOString().split('T')[0];

  const priorityMap = {
    'index.html': { priority: '1.0', changefreq: 'weekly', loc: '/' },
    'services.html': { priority: '0.9', changefreq: 'weekly', loc: '/services.html' },
    'healthcare.html': { priority: '0.9', changefreq: 'weekly', loc: '/healthcare.html' },
    'landing.html': { priority: '0.8', changefreq: 'weekly', loc: '/landing.html' },
    'case-studies.html': { priority: '0.8', changefreq: 'monthly', loc: '/case-studies.html' },
    'about.html': { priority: '0.8', changefreq: 'monthly', loc: '/about.html' },
    'blog.html': { priority: '0.9', changefreq: 'weekly', loc: '/blog.html' },
    'contact.html': { priority: '0.8', changefreq: 'monthly', loc: '/contact.html' },
    'thank-you.html': { priority: '0.3', changefreq: 'yearly', loc: '/thank-you.html' }
  };

  const xmlEntries = pages.map(p => {
    const config = priorityMap[p.filename] || { priority: '0.6', changefreq: 'monthly', loc: `/${p.filename}` };
    const loc = `${domain}${config.loc}`;
    const lastmod = p.lastModified ? p.lastModified.split('T')[0] : today;

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${config.changefreq}</changefreq>
    <priority>${config.priority}</priority>
  </url>`;
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries.join('\n')}
</urlset>
`;

  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');
  return sitemapXml;
}

function getRobotsTxt() {
  const robotsPath = path.join(ROOT_DIR, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    return fs.readFileSync(robotsPath, 'utf8');
  }
  const domain = getSiteDomain();
  return `# Curafy Digitech - robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /.seo_backups/
Disallow: /thank-you.html

# Sitemaps
Sitemap: ${domain}/sitemap.xml
`;
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const getJsonBody = (cb) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        cb(null, json);
      } catch (err) {
        cb(err);
      }
    });
  };

  // --- API Endpoints ---
  
  if (method === 'GET' && pathname === '/api/pages') {
    try {
      const pages = getAllPages();
      const domain = getSiteDomain();
      
      const totalScore = pages.reduce((acc, p) => acc + (p.seoScore || 0), 0);
      const avgScore = pages.length > 0 ? Math.round(totalScore / pages.length) : 0;
      
      let criticalIssues = 0;
      let warnings = 0;
      pages.forEach(p => {
        (p.checks || []).forEach(c => {
          if (!c.passed) {
            if (c.type === 'critical') criticalIssues++;
            else if (c.type === 'warning') warnings++;
          }
        });
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        domain,
        siteAverageScore: avgScore,
        criticalIssues,
        warnings,
        pages
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (method === 'GET' && pathname === '/api/page') {
    const filename = parsedUrl.query.filename;
    if (!filename) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Filename is required' }));
      return;
    }
    const pageData = parseHtmlFile(filename);
    if (!pageData) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Page not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, page: pageData }));
    return;
  }

  if (method === 'POST' && pathname === '/api/pages/update') {
    getJsonBody((err, data) => {
      if (err || !data || !data.filename) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid payload or missing filename' }));
        return;
      }
      try {
        const updatedPage = updateHtmlFile(data.filename, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Successfully updated SEO tags for ${data.filename}`,
          page: updatedPage
        }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (method === 'GET' && pathname === '/api/sitemap') {
    const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
    let content = '';
    if (fs.existsSync(sitemapPath)) {
      content = fs.readFileSync(sitemapPath, 'utf8');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, sitemap: content, exists: Boolean(content) }));
    return;
  }

  if (method === 'POST' && pathname === '/api/sitemap/generate') {
    try {
      const xml = generateSitemap();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Sitemap generated successfully!', sitemap: xml }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  if (method === 'POST' && pathname === '/api/sitemap/save') {
    getJsonBody((err, data) => {
      if (err || !data || typeof data.content !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid sitemap content' }));
        return;
      }
      try {
        fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), data.content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'sitemap.xml saved successfully!' }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (method === 'GET' && pathname === '/api/robots') {
    const content = getRobotsTxt();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, robots: content }));
    return;
  }

  if (method === 'POST' && pathname === '/api/robots/save') {
    getJsonBody((err, data) => {
      if (err || !data || typeof data.content !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid robots.txt content' }));
        return;
      }
      try {
        fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), data.content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'robots.txt saved successfully!' }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // GET /api/blogs: Read all blogs
  if (method === 'GET' && pathname === '/api/blogs') {
    try {
      const blogsPath = path.join(ROOT_DIR, 'assets', 'data', 'blogs.json');
      let blogs = [];
      if (fs.existsSync(blogsPath)) {
        blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, blogs }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // POST /api/blogs/save: Save blogs array
  if (method === 'POST' && pathname === '/api/blogs/save') {
    getJsonBody((err, data) => {
      if (err || !data || !Array.isArray(data.blogs)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid blogs payload' }));
        return;
      }
      try {
        const blogsPath = path.join(ROOT_DIR, 'assets', 'data', 'blogs.json');
        fs.writeFileSync(blogsPath, JSON.stringify(data.blogs, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Blogs saved successfully!' }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (method === 'GET' && pathname === '/api/backups') {
    try {
      const page = parsedUrl.query.page;
      const allFiles = fs.readdirSync(BACKUP_DIR);
      let backups = allFiles.filter(f => f.endsWith('.bak.html'));
      if (page) {
        const baseName = page.replace(/\.html$/, '');
        backups = backups.filter(f => f.startsWith(`${baseName}.`));
      }
      backups.sort().reverse();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, backups }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  if (method === 'POST' && pathname === '/api/backups/restore') {
    getJsonBody((err, data) => {
      if (err || !data || !data.backupFileName || !data.targetPage) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing backupFileName or targetPage' }));
        return;
      }
      try {
        const backupPath = path.join(BACKUP_DIR, data.backupFileName);
        const targetPath = path.join(ROOT_DIR, data.targetPage);
        if (!fs.existsSync(backupPath)) {
          throw new Error('Backup file not found');
        }
        const preRestoreBackup = `${data.targetPage.replace(/\.html$/, '')}.${new Date().toISOString().replace(/[:.]/g, '-')}.pre-restore.bak.html`;
        fs.copyFileSync(targetPath, path.join(BACKUP_DIR, preRestoreBackup));
        
        fs.copyFileSync(backupPath, targetPath);

        const updatedPage = parseHtmlFile(data.targetPage);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Restored ${data.targetPage} from backup ${data.backupFileName}`,
          page: updatedPage
        }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // --- Static Files Serving ---
  let filePath = '';
  if (pathname === '/' || pathname === '/index.html' || pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/index.html') {
    filePath = path.join(ADMIN_DIR, 'index.html');
  } else if (pathname === '/app.js' || pathname === '/admin/app.js') {
    filePath = path.join(ADMIN_DIR, 'app.js');
  } else if (pathname === '/styles.css' || pathname === '/admin/styles.css') {
    filePath = path.join(ADMIN_DIR, 'styles.css');
  } else if (pathname.startsWith('/assets/')) {
    filePath = path.join(ROOT_DIR, pathname.replace(/^\//, ''));
  } else {
    const candidateRoot = path.join(ROOT_DIR, pathname.replace(/^\//, ''));
    if (fs.existsSync(candidateRoot) && fs.statSync(candidateRoot).isFile()) {
      filePath = candidateRoot;
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 Curafy Digitech - SEO Admin Panel is Running!`);
  console.log(`  🔗 URL: http://localhost:${PORT}`);
  console.log(`  📁 Workspace: ${ROOT_DIR}`);
  console.log(`======================================================\n`);
});
