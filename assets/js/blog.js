// Curafy Digitech - Blog Listing & Filter Engine

let allBlogs = [];
let activeCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {
  loadBlogPosts();

  // Search input event listener
  const searchInput = document.getElementById('blog-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderBlogCards();
    });
  }
});

async function loadBlogPosts() {
  const grid = document.getElementById('blogs-grid');
  try {
    const res = await fetch('assets/data/blogs.json?v=' + Date.now());
    if (!res.ok) throw new Error('Could not load blog data');
    allBlogs = await res.json();
    
    renderFeaturedPost();
    renderBlogCards();
  } catch (err) {
    console.error('Blog load error:', err);
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-500">
          <p class="text-base font-semibold">Unable to load blog articles at this time.</p>
          <p class="text-sm mt-1">Please refresh the page or check back shortly.</p>
        </div>
      `;
    }
  }
}

function renderFeaturedPost() {
  const container = document.getElementById('featured-post-container');
  if (!container) return;

  const featured = allBlogs.find(b => b.featured) || allBlogs[0];
  if (!featured) {
    container.classList.add('hidden');
    return;
  }

  container.innerHTML = `
    <div class="glass-card bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <!-- Featured Image -->
        <div class="lg:col-span-7 relative min-h-[300px] lg:min-h-[420px] overflow-hidden group">
          <img src="${escapeHtml(featured.image)}" alt="${escapeHtml(featured.title)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:hidden"></div>
          <div class="absolute top-4 left-4">
            <span class="px-3.5 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs shadow-md uppercase tracking-wider">
              Featured Insight
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            <div class="flex items-center gap-3 text-xs font-semibold text-slate-500 mb-3">
              <span class="text-blue-600 uppercase tracking-wider">${escapeHtml(featured.category)}</span>
              <span>•</span>
              <span>${escapeHtml(featured.readTime)}</span>
              <span>•</span>
              <span>${escapeHtml(featured.date)}</span>
            </div>

            <h3 class="font-heading font-bold text-2xl lg:text-3xl text-slate-900 leading-tight mb-4 hover:text-blue-600 transition-colors">
              <a href="blog-post.html?slug=${encodeURIComponent(featured.slug)}">
                ${escapeHtml(featured.title)}
              </a>
            </h3>

            <p class="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
              ${escapeHtml(featured.excerpt)}
            </p>
          </div>

          <div class="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img src="${escapeHtml(featured.authorAvatar || 'assets/images/curafy-logo-mark.png')}" alt="${escapeHtml(featured.author)}" class="w-10 h-10 rounded-full object-cover border border-slate-200">
              <div>
                <div class="text-xs font-bold text-slate-900">${escapeHtml(featured.author)}</div>
                <div class="text-[11px] text-slate-500">Curafy Performance Lab</div>
              </div>
            </div>

            <a href="blog-post.html?slug=${encodeURIComponent(featured.slug)}" class="inline-flex items-center gap-1.5 font-bold text-xs text-blue-600 hover:text-blue-700 transition">
              <span>Read Article</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function filterCategory(category) {
  activeCategory = category;

  // Update button active states
  const buttons = document.querySelectorAll('.cat-filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-category') === category) {
      btn.className = 'cat-filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md shadow-blue-500/20 transition cursor-pointer';
    } else {
      btn.className = 'cat-filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer';
    }
  });

  renderBlogCards();
}

function renderBlogCards() {
  const grid = document.getElementById('blogs-grid');
  if (!grid) return;

  const searchQuery = (document.getElementById('blog-search-input')?.value || '').toLowerCase().trim();

  let filtered = allBlogs.filter(b => {
    const matchesCategory = (activeCategory === 'All') || (b.category === activeCategory);
    const matchesSearch = !searchQuery || 
      b.title.toLowerCase().includes(searchQuery) || 
      b.excerpt.toLowerCase().includes(searchQuery) ||
      b.category.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <i data-lucide="search-x" class="w-8 h-8"></i>
        </div>
        <h4 class="font-heading font-bold text-lg text-slate-800">No Articles Found</h4>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">No articles matched your search query or selected category filter. Try clearing your search.</p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">
          Clear Filters
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered.map(post => {
    return `
      <article class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
        <div>
          <!-- Thumbnail -->
          <a href="blog-post.html?slug=${encodeURIComponent(post.slug)}" class="block relative h-52 overflow-hidden bg-slate-100">
            <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">
            <div class="absolute top-3 left-3">
              <span class="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-semibold text-[11px] shadow">
                ${escapeHtml(post.category)}
              </span>
            </div>
          </a>

          <!-- Details -->
          <div class="p-6">
            <div class="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-2.5">
              <span>${escapeHtml(post.date)}</span>
              <span>•</span>
              <span>${escapeHtml(post.readTime)}</span>
            </div>

            <h3 class="font-heading font-bold text-lg text-slate-900 leading-snug mb-2.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
              <a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
                ${escapeHtml(post.title)}
              </a>
            </h3>

            <p class="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4">
              ${escapeHtml(post.excerpt)}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="${escapeHtml(post.authorAvatar || 'assets/images/curafy-logo-mark.png')}" alt="${escapeHtml(post.author)}" class="w-6 h-6 rounded-full object-cover">
            <span class="text-xs font-medium text-slate-700">${escapeHtml(post.author)}</span>
          </div>

          <a href="blog-post.html?slug=${encodeURIComponent(post.slug)}" class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>Read</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </a>
        </div>
      </article>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function resetFilters() {
  const searchInput = document.getElementById('blog-search-input');
  if (searchInput) searchInput.value = '';
  filterCategory('All');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
