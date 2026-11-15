import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyA7vBJKtJ0iY61y-3iqCvKByIThAzYOF0o",
    authDomain: "pixelplay-8ac18.firebaseapp.com",
    projectId: "pixelplay-8ac18",
    storageBucket: "pixelplay-8ac18.firebasestorage.app",
    messagingSenderId: "965382522854",
    appId: "1:965382522854:web:914d76200b0798d6d1f827",
    measurementId: "G-NSGMLJ94G4"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Header profile picture: same DP as profile/comment page, blank icon if user has none
onAuthStateChanged(auth, async (user) => {
    const btn = document.querySelector('.header-avatar-btn');
    const img = document.getElementById('header-avatar-img');
    // Header state: red "Sign in" button when logged out, profile picture when logged in
    document.body.classList.add('auth-ready');
    document.body.classList.toggle('auth-out', !user);
    document.body.classList.toggle('auth-in', !!user);

    if (!btn || !img) return;

    const showBlank = () => btn.classList.remove('has-photo');

    if (!user) { showBlank(); return; }

    let photo = '';
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().photoURL) {
            photo = snap.data().photoURL;
        } else if (user.photoURL) {
            photo = user.photoURL.replace(/=s96-c/, '=s400-c');
        }
    } catch (e) {
        photo = user.photoURL ? user.photoURL.replace(/=s96-c/, '=s400-c') : '';
    }

    if (!photo) { showBlank(); return; }

    img.onload = () => btn.classList.add('has-photo');
    img.onerror = showBlank;
    img.src = photo;
});

let searchOpen = false;
let sidebarOpen = false;

window.toggleSearch = function() {
    const searchBar = document.getElementById('search-bar-container');
    const overlay = document.getElementById('screen-overlay');
    const sidebar = document.getElementById('sidebar');

    if (sidebarOpen) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');

        const switchLine = document.getElementById('switch-line');

        if (switchLine) {
            switchLine.setAttribute('x1', '7');
            switchLine.setAttribute('x2', '7');
        }

        sidebarOpen = false;
    }

    if (!searchOpen) {
        if (searchBar) searchBar.style.display = 'flex';
        if (overlay) overlay.style.display = 'block';

        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();

        searchOpen = true;
    } else {
        window.closeEverything();
    }
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('screen-overlay');
    const searchBar = document.getElementById('search-bar-container');
    const suggestions = document.getElementById('search-suggestions');
    const switchLine = document.getElementById('switch-line');

    if (searchOpen) {
        if (searchBar) searchBar.style.display = 'none';
        if (suggestions) suggestions.style.display = 'none';
        searchOpen = false;
    }

    if (!sidebarOpen) {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.style.display = 'block';
        document.body.classList.add('sidebar-open');

        if (switchLine) {
            switchLine.setAttribute('x1', '17');
            switchLine.setAttribute('x2', '17');
        }

        sidebarOpen = true;
    } else {
        window.closeEverything();
    }
};

window.closeEverything = function() {
    const searchBar = document.getElementById('search-bar-container');
    const suggestions = document.getElementById('search-suggestions');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('screen-overlay');
    const searchResults = document.getElementById('search-results-container');
    const defaultContainer = document.getElementById('default-sections-container');
    const allAnimeContainer = document.getElementById('all-anime-container');
    const categoryContainer = document.getElementById('category-section-container');

    if (searchBar) searchBar.style.display = 'none';
    if (suggestions) suggestions.style.display = 'none';
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.style.display = 'none';

    document.body.classList.remove('sidebar-open');

    const switchLine = document.getElementById('switch-line');

    if (switchLine) {
        switchLine.setAttribute('x1', '7');
        switchLine.setAttribute('x2', '7');
    }

    if (searchResults) searchResults.style.display = 'none';
    if (window.resetFilters) window.resetFilters();
    if (defaultContainer) defaultContainer.style.display = 'block';
    if (allAnimeContainer) allAnimeContainer.style.display = 'block';

    searchOpen = false;
    sidebarOpen = false;
};

window.clearSearchInput = function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const suggestionsBox = document.getElementById('search-suggestions');

    if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
        suggestionsBox.innerHTML = '';
    }

    const searchContainer = document.getElementById('search-results-container');
    const defaultContainer = document.getElementById('default-sections-container');
    const allAnimeContainer = document.getElementById('all-anime-container');
    const categoryContainer = document.getElementById('category-section-container');

    if (searchContainer) searchContainer.style.display = 'none';
    if (window.resetFilters) window.resetFilters();
    if (defaultContainer) defaultContainer.style.display = 'block';
    if (allAnimeContainer) allAnimeContainer.style.display = 'block';

    if (searchInput) searchInput.focus();
};

window.handleProfileClick = function() {
    const user = auth.currentUser;

    if (user) {
        window.location.href = 'profile.html';
    } else {
        showLoginRequiredModal();
    }
};

window.handleLogoutClick = function() {
    const user = auth.currentUser;

    if (user) {
        showLogoutConfirmationModal();
    } else {
        showLoginRequiredModal();
    }
};

function showLoginRequiredModal() {
    let existingModal = document.getElementById('auth-alert-modal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="auth-alert-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: #161616; border: 1px solid #333; border-radius: 12px; padding: 25px; max-width: 320px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.9);">
                <h3 style="color: #ffffff; font-size: 18px; margin-bottom: 10px;">Authentication Required</h3>
                <p style="color: #bbb; font-size: 13px; margin-bottom: 20px; line-height: 1.4;">Please login first to access your profile and features.</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="window.location.href='login.html'" style="background: #ff0000; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; flex: 1;">Login</button>
                    <button onclick="closeAuthModal()" style="background: #333; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; flex: 1;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showLogoutConfirmationModal() {
    let existingModal = document.getElementById('auth-alert-modal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="auth-alert-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: #161616; border: 1px solid #333; border-radius: 12px; padding: 25px; max-width: 320px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.9);">
                <h3 style="color: #ffffff; font-size: 18px; margin-bottom: 10px;">Confirm Logout</h3>
                <p style="color: #bbb; font-size: 13px; margin-bottom: 20px; line-height: 1.4;">Are you sure you want to log out of your account?</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="performLogout()" style="background: #ff0000; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; flex: 1;">Logout</button>
                    <button onclick="closeAuthModal()" style="background: #333; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; flex: 1;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.performLogout = function() {
    const audio = document.getElementById('logoutAudio');

    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Logout audio error:", e));
    }

    sessionStorage.clear();

    setTimeout(() => {
        signOut(auth).then(() => {
            window.location.reload();
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    }, 4000);
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-alert-modal');
    if (modal) modal.remove();
};

let heroIndex = 0;
const heroSlides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');
const viewButtons = document.querySelectorAll('.hero-view-btn');
const wrapper = document.getElementById('slidesWrapper');
const totalRealSlides = 5;

function updateHeroSlider(index) {
    if (heroSlides.length === 0 || !wrapper) return;

    heroIndex = index;
    wrapper.style.transition = 'transform 0.5s ease-in-out';
    wrapper.style.transform = `translateX(-${heroIndex * 100}%)`;

    if (heroIndex === totalRealSlides) {
        setTimeout(() => {
            wrapper.style.transition = 'none';
            heroIndex = 0;
            wrapper.style.transform = `translateX(0%)`;
        }, 500);
    }

    let activeDotIndex = heroIndex >= totalRealSlides ? 0 : heroIndex;

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeDotIndex);
    });

    viewButtons.forEach((btn, i) => {
        btn.classList.toggle('active', i === activeDotIndex);
    });
}

window.currentSlide = function(index) {
    updateHeroSlider(index);
};

setInterval(() => {
    updateHeroSlider(heroIndex + 1);
}, 4000);

async function loadHomeAnime() {
    try {
        const trendingRes = await fetch(`https://kitsu.io/api/edge/anime?page[limit]=10&sort=-userCount&nsfw=true`);
        const trendingData = await trendingRes.json();
        renderGrid(trendingData.data, 'trending-grid');
        renderSideList(trendingData.data, 'trending-list');

        const newRes = await fetch(`https://kitsu.io/api/edge/anime?page[limit]=10&sort=-startDate&nsfw=true`);
        const newData = await newRes.json();
        renderGrid(newData.data, 'new-releases-grid');
        renderSideList(newData.data, 'new-releases-list');

    } catch (error) {
        console.error('Error loading home anime:', error);
    }
}

// Desktop sidebar list (Top Trending / New Releases)
function renderSideList(animeList, containerId, maxItems = 10) {
    const box = document.getElementById(containerId);
    if (!box) return;

    box.innerHTML = '';

    (animeList || []).slice(0, maxItems).forEach(anime => {
        const attr = anime.attributes;
        const rawTitle = attr.canonicalTitle || attr.titles.en_jp || attr.titles.en || 'Unknown Anime';
        const posterObj = attr.posterImage;
        const poster = posterObj ? (posterObj.small || posterObj.medium) : 'https://via.placeholder.com/100x140?text=No+Image';
        const rating = attr.averageRating ? (attr.averageRating / 10).toFixed(1) : '8.0';

        const item = document.createElement('div');
        item.className = 'side-item';
        item.innerHTML = `
            <img class="side-thumb" alt="" loading="lazy">
            <div class="side-info">
                <div class="side-title"></div>
                <div class="side-meta">
                    <span class="side-rating">★ ${rating}</span>
                    <span class="side-type">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg> TV
                    </span>
                    <span>Japan</span>
                </div>
            </div>
        `;

        item.querySelector('.side-thumb').src = poster;
        item.querySelector('.side-title').textContent = rawTitle;
        item.title = rawTitle;
        item.addEventListener('click', () => window.handleAnimeClick(anime.slug, rawTitle, poster, rating));

        box.appendChild(item);
    });
}

function renderGrid(animeList, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    grid.innerHTML = '';

    if (!animeList || animeList.length === 0) {
        grid.innerHTML = '<p style="color: #aaa; grid-column: 1/-1; text-align: center; padding: 20px;">Koi anime nahi mila.</p>';
        return;
    }

    animeList.forEach(anime => {
        const attr = anime.attributes;
        const rawTitle = attr.canonicalTitle || attr.titles.en_jp || attr.titles.en || 'Unknown Anime';
        const safeTitle = rawTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const poster = attr.posterImage ? attr.posterImage.medium : 'https://via.placeholder.com/300x450?text=No+Image';
        const rating = attr.averageRating ? (attr.averageRating / 10).toFixed(1) : '8.0';
        const slug = anime.slug;

        const cardHTML = `
            <div class="anime-card" onclick="handleAnimeClick('${slug}', '${safeTitle}', '${poster}', '${rating}')">
                <img src="${poster}" alt="${rawTitle}" class="anime-poster" loading="lazy">
                <div class="anime-info">
                    <div class="anime-title" title="${rawTitle}">${rawTitle}</div>
                    <div class="anime-rating">★ ${rating}</div>
                </div>
            </div>
        `;

        grid.innerHTML += cardHTML;
    });
}

/* ===================== ALL ANIME - PAGINATION (45 per page) ===================== */
const ANIME_PER_PAGE = 45;
const KITSU_MAX_REQUEST = 20;   // Kitsu allows max 20 per request, so 1 page = 3 requests (20 + 20 + 5)

let currentPage = 1;
let totalPages = 1;
let allAnimeGen = 0;            // bumps on every page change so stale responses are ignored
let pageNumbersBuiltFor = 0;

async function fetchAllAnimePage(page) {
    const base = (page - 1) * ANIME_PER_PAGE;
    const requests = [];

    for (let done = 0; done < ANIME_PER_PAGE; done += KITSU_MAX_REQUEST) {
        const limit = Math.min(KITSU_MAX_REQUEST, ANIME_PER_PAGE - done);
        const apiUrl = `https://kitsu.io/api/edge/anime?page[limit]=${limit}&page[offset]=${base + done}&sort=-userCount&nsfw=true`;

        requests.push(fetch(apiUrl).then(r => r.json()));
    }

    const results = await Promise.all(requests);

    return {
        items: results.flatMap(r => r.data || []),
        count: results[0] && results[0].meta ? results[0].meta.count : null
    };
}

function buildPageNumbers() {
    const box = document.getElementById('page-numbers');
    if (!box || pageNumbersBuiltFor === totalPages) return;

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button type="button" class="page-num" data-page="${i}" onclick="goToPage(${i})">${i}</button>`;
    }

    box.innerHTML = html;
    pageNumbersBuiltFor = totalPages;
}

function updatePagination() {
    buildPageNumbers();

    const box = document.getElementById('page-numbers');
    const prev = document.getElementById('page-prev');
    const next = document.getElementById('page-next');

    if (prev) prev.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= totalPages;

    if (!box) return;

    const old = box.querySelector('.page-num.active');
    if (old) old.classList.remove('active');

    const now = box.querySelector(`.page-num[data-page="${currentPage}"]`);

    if (now) {
        now.classList.add('active');

        // keep the current page number inside the visible area of the side-scroll row
        if (now.offsetLeft < box.scrollLeft || now.offsetLeft + now.offsetWidth > box.scrollLeft + box.clientWidth) {
            box.scrollLeft = now.offsetLeft - (box.clientWidth - now.offsetWidth) / 2;
        }
    }
}

async function loadAllAnimePage(page) {
    const myGen = ++allAnimeGen;
    currentPage = page;

    const grid = document.getElementById('anime-grid');
    const scrollLoader = document.getElementById('scroll-loader');

    if (grid) grid.innerHTML = '';
    if (scrollLoader) scrollLoader.style.display = 'block';

    updatePagination();

    try {
        const { items, count } = await fetchAllAnimePage(page);

        if (myGen !== allAnimeGen) return;   // a newer page request replaced this one

        if (count) {
            totalPages = Math.max(1, Math.ceil(count / ANIME_PER_PAGE));
            updatePagination();
        }

        if (grid) {
            if (items.length === 0) {
                grid.innerHTML = '<p style="color: #aaa; grid-column: 1/-1; text-align: center; padding: 20px;">Is page par koi anime nahi mila.</p>';
            } else {
                grid.innerHTML = items.map(buildCardHTML).join('');
            }
        }

    } catch (error) {
        console.error('Error loading All Anime:', error);

        if (myGen !== allAnimeGen) return;

        if (grid) {
            grid.innerHTML = '<p style="color: #aaa; grid-column: 1/-1; text-align: center; padding: 20px;">Unable to load anime. Please try again.</p>';
        }

    } finally {
        if (myGen === allAnimeGen && scrollLoader) scrollLoader.style.display = 'none';
    }
}

// Previous / Next buttons: -1 or +1 from the page the user is on
window.changePage = function(step) {
    window.goToPage(currentPage + step);
};

// Same home page, only the "All Anime" section changes to the chosen page
window.goToPage = function(page) {
    page = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);

    if (page === currentPage) return;

    const section = document.getElementById('all-anime-container');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    loadAllAnimePage(page);
};

/* ===================== FILTER BAR (All / Filter / Refresh) ===================== */
const KITSU_API = 'https://kitsu.io/api/edge/anime';
const FILTER_PAGE = 20;      // Kitsu max per request
const SCAN_PAGES = 8;        // pages scanned per batch for A-Z / Country filters

const ICON_CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';
const ICON_STAR = '<svg viewBox="0 0 24 24" fill="#ffc83d"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
const ICON_CONTINUING = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00c800"/><path d="M6.8 8.5L9.3 12L6.8 15.5M10.8 8.5L13.3 12L10.8 15.5M14.8 8.5L17.3 12L14.8 15.5" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_COMPLETED = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00c800"/><polyline points="6.5 12.5 10.5 16.5 17.5 8.5" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const FILTER_GROUPS = [
    { key: 'az',      label: 'A - Z List' },
    { key: 'rating',  label: 'Rating' },
    { key: 'country', label: 'Country' },
    { key: 'status',  label: 'Status' },
    { key: 'type',    label: 'Type' }
];
const RATING_STARTS = [5, 6, 7, 8, 9];   // 5 - 5.9, 6 - 6.9, 7 - 7.9 ...
const COUNTRIES = [
    { name: 'Japan', flag: '🇯🇵' },
    { name: 'China', flag: '🇨🇳' },
    { name: 'Korea', flag: '🇰🇷' }
];
const STATUSES = [
    { label: 'Continuing', value: 'current',  icon: ICON_CONTINUING },
    { label: 'Completed',  value: 'finished', icon: ICON_COMPLETED }
];
const TYPES = [
    { label: 'TV',      value: 'TV' },
    { label: 'Movie',   value: 'movie' },
    { label: 'OVA',     value: 'OVA' },
    { label: 'ONA',     value: 'ONA' },
    { label: 'Special', value: 'special' }
];

let filterState = null;      // currently applied filter (null = "All")
let filterGen = 0;           // bumps on every change so stale responses are ignored
let filterLoading = false;
let filterMenuOpen = false;

const $ = (id) => document.getElementById(id);

function animeTitle(anime) {
    const a = anime.attributes;
    return a.canonicalTitle || (a.titles && (a.titles.en_jp || a.titles.en)) || 'Unknown Anime';
}

// Kitsu has no "country" field, so it is detected from the title language keys
function detectCountry(anime) {
    const keys = Object.keys((anime.attributes && anime.attributes.titles) || {});
    if (keys.some(k => /(^ko)|(_kr$)/i.test(k))) return 'Korea';
    if (keys.some(k => /(^zh)|(_cn$)|(_tw$)|(_hk$)/i.test(k))) return 'China';
    return 'Japan';
}

function buildCardHTML(anime) {
    const attr = anime.attributes;
    const rawTitle = animeTitle(anime);
    const safeTitle = rawTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const poster = attr.posterImage ? attr.posterImage.medium : 'https://via.placeholder.com/300x450?text=No+Image';
    const rating = attr.averageRating ? (attr.averageRating / 10).toFixed(1) : '8.0';

    return `
        <div class="anime-card" onclick="handleAnimeClick('${anime.slug || attr.slug}', '${safeTitle}', '${poster}', '${rating}')">
            <img src="${poster}" alt="${rawTitle}" class="anime-poster" loading="lazy">
            <div class="anime-info">
                <div class="anime-title" title="${rawTitle}">${rawTitle}</div>
                <div class="anime-rating">★ ${rating}</div>
            </div>
        </div>
    `;
}

function setFilterMessage(html, color) {
    const grid = $('category-grid');
    if (!grid) return;
    grid.innerHTML = `<p class="filter-msg" style="color: ${color || '#888'}; grid-column: 1/-1; text-align: center; padding: 20px;">${html}</p>`;
}

function appendFilterCards(items) {
    const grid = $('category-grid');
    if (!grid) return;
    grid.querySelectorAll('.filter-msg').forEach(n => n.remove());
    grid.insertAdjacentHTML('beforeend', items.map(buildCardHTML).join(''));
}

/* ---------- build the request for each filter ---------- */
function buildFilterState(kind, value) {
    const base = 'sort=-userCount';

    if (kind === 'az') {
        return {
            title: `Anime starting with "${value}"`,
            params: `filter[text]=${encodeURIComponent(value)}&${base}`,
            pages: SCAN_PAGES,
            predicate: (a) => animeTitle(a).trim().toUpperCase().startsWith(value)
        };
    }
    if (kind === 'rating') {
        const lo = value * 10, hi = value * 10 + 9.99;      // Kitsu rating is 0-100
        return {
            title: `Rating: ${value} - ${value}.9 ★`,
            params: `filter[averageRating]=${lo}..${hi}&${base}`,
            pages: 1,
            predicate: null
        };
    }
    if (kind === 'country') {
        return {
            title: `Country: ${value}`,
            params: base,
            pages: SCAN_PAGES,
            predicate: (a) => detectCountry(a) === value
        };
    }
    if (kind === 'status') {
        const s = STATUSES.find(x => x.value === value);
        return { title: `Status: ${s ? s.label : value}`, params: `filter[status]=${value}&${base}`, pages: 1, predicate: null };
    }
    if (kind === 'type') {
        const t = TYPES.find(x => x.value === value);
        return { title: `Type: ${t ? t.label : value}`, params: `filter[subtype]=${value}&${base}`, pages: 1, predicate: null };
    }
    return null;
}

async function fetchKitsuPage(params, offset) {
    const res = await fetch(`${KITSU_API}?${params}&nsfw=true&page[limit]=${FILTER_PAGE}&page[offset]=${offset}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    return json.data || [];
}

async function loadFilterBatch() {
    const st = filterState;
    if (!st || st.done || filterLoading) return;

    const gen = filterGen;
    const moreBtn = $('filter-load-more');
    filterLoading = true;

    if (moreBtn) { moreBtn.disabled = true; moreBtn.textContent = 'Loading...'; }

    let added = 0;

    try {
        for (let loops = 0; !st.done && added < 12 && loops < 4; loops++) {
            const reqs = [];
            for (let i = 0; i < st.pages; i++) reqs.push(fetchKitsuPage(st.params, st.offset + i * FILTER_PAGE));

            const pagesData = await Promise.all(reqs);
            if (gen !== filterGen) return;                    // user changed filter meanwhile

            st.offset += st.pages * FILTER_PAGE;
            if (pagesData[pagesData.length - 1].length < FILTER_PAGE || st.offset >= 9980) st.done = true;

            let items = pagesData.flat().filter(a => a && !st.seen.has(a.id));
            items.forEach(a => st.seen.add(a.id));
            if (st.predicate) items = items.filter(st.predicate);

            if (items.length) {
                appendFilterCards(items);
                added += items.length;
            }
        }
    } catch (err) {
        console.error('Filter fetch error:', err);
        if (gen === filterGen) {
            if (!$('category-grid').querySelector('.anime-card')) {
                setFilterMessage('Failed to load. Dobara try karain.', '#ff6b6b');
            }
        }
    } finally {
        if (gen === filterGen) {
            filterLoading = false;

            const hasCards = !!$('category-grid').querySelector('.anime-card');
            if (!hasCards && st.done) setFilterMessage('Koi anime nahi mila.', '#aaa');

            if (moreBtn) {
                moreBtn.disabled = false;
                moreBtn.textContent = 'Load more';
                moreBtn.style.display = (!st.done && hasCards) ? 'block' : 'none';
            }
        }
    }
}

/* ---------- buttons / pills state ---------- */
function updateFilterPills() {
    const allBtn = $('filter-all-btn');
    const toggle = $('filter-toggle');
    if (!allBtn || !toggle) return;

    allBtn.classList.toggle('active', !filterState);
    toggle.classList.toggle('active', !!filterState || filterMenuOpen);
    toggle.classList.toggle('open', filterMenuOpen);          // arrow points down while open
    toggle.setAttribute('aria-expanded', filterMenuOpen ? 'true' : 'false');
}

/* ---------- popup menu ---------- */
function makeItem(label, rightHTML, selected, onClick) {
    const row = document.createElement('div');
    row.className = 'f-item' + (selected ? ' selected' : '');
    const text = document.createElement('span');
    text.textContent = label;
    row.appendChild(text);
    if (rightHTML) {
        const right = document.createElement('span');
        right.style.display = 'flex';
        right.innerHTML = rightHTML;
        row.appendChild(right);
    }
    row.addEventListener('click', onClick);
    return row;
}

function renderMainMenu() {
    const popup = $('filter-popup');
    popup.innerHTML = '';
    FILTER_GROUPS.forEach(g => popup.appendChild(makeItem(g.label, ICON_CHEVRON, false, () => renderSubMenu(g.key))));
}

function renderSubMenu(key) {
    const popup = $('filter-popup');
    popup.innerHTML = '';
    const cur = filterState && filterState.kind === key ? filterState.value : null;
    const pick = (value) => applyFilter(key, value);

    if (key === 'az') {
        const wrap = document.createElement('div');
        wrap.className = 'f-letters';
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(ch => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'f-letter' + (cur === ch ? ' selected' : '');
            b.textContent = ch;
            b.addEventListener('click', () => pick(ch));
            wrap.appendChild(b);
        });
        popup.appendChild(wrap);
    } else if (key === 'rating') {
        RATING_STARTS.forEach(n => popup.appendChild(makeItem(`${n} - ${n}.9`, ICON_STAR, cur === n, () => pick(n))));
    } else if (key === 'country') {
        COUNTRIES.forEach(c => popup.appendChild(makeItem(c.name, `<span class="f-emoji">${c.flag}</span>`, cur === c.name, () => pick(c.name))));
    } else if (key === 'status') {
        STATUSES.forEach(s => popup.appendChild(makeItem(s.label, s.icon, cur === s.value, () => pick(s.value))));
    } else if (key === 'type') {
        TYPES.forEach(t => popup.appendChild(makeItem(t.label, '', cur === t.value, () => pick(t.value))));
    }
}

function openFilterMenu() {
    filterMenuOpen = true;
    const popup = $('filter-popup');
    popup.hidden = false;
    renderMainMenu();
    updateFilterPills();
}

function closeFilterMenu() {
    filterMenuOpen = false;
    const popup = $('filter-popup');
    if (popup) popup.hidden = true;
    updateFilterPills();
}

window.toggleFilterMenu = function() {
    if (filterMenuOpen) closeFilterMenu(); else openFilterMenu();
};

document.addEventListener('click', (e) => {
    if (!filterMenuOpen) return;
    // composedPath() is captured when the click happens, so it still works even if the
    // clicked menu item was removed from the page while the sub-menu was being drawn
    const wrap = $('filter-popup') && $('filter-popup').parentElement;
    const inside = wrap && e.composedPath().includes(wrap);
    if (!inside) closeFilterMenu();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && filterMenuOpen) closeFilterMenu();
});

/* ---------- apply / clear ---------- */
function applyFilter(kind, value) {
    const cfg = buildFilterState(kind, value);
    if (!cfg) return;

    filterGen++;
    filterLoading = false;
    filterState = { ...cfg, kind, value, offset: 0, done: false, seen: new Set() };

    const searchContainer = $('search-results-container');
    const defaultContainer = $('default-sections-container');
    const allAnimeContainer = $('all-anime-container');
    const categoryContainer = $('category-section-container');

    if (searchContainer) searchContainer.style.display = 'none';
    if (defaultContainer) defaultContainer.style.display = 'none';
    if (allAnimeContainer) allAnimeContainer.style.display = 'none';
    if (categoryContainer) categoryContainer.style.display = 'block';

    $('category-section-title').textContent = cfg.title;
    $('filter-load-more').style.display = 'none';
    setFilterMessage('Loading...');

    closeFilterMenu();
    loadFilterBatch();
}

// Removes any active filter and shows the normal "All Anime" list again
window.resetFilters = function() {
    filterGen++;
    filterLoading = false;
    filterState = null;

    const categoryContainer = $('category-section-container');
    const defaultContainer = $('default-sections-container');
    const allAnimeContainer = $('all-anime-container');
    if (categoryContainer) categoryContainer.style.display = 'none';
    if (defaultContainer) defaultContainer.style.display = 'block';
    if (allAnimeContainer) allAnimeContainer.style.display = 'block';

    closeFilterMenu();
    updateFilterPills();
};

window.showAllAnime = function() {
    const searchContainer = $('search-results-container');
    const defaultContainer = $('default-sections-container');

    window.resetFilters();

    if (searchContainer) searchContainer.style.display = 'none';
    if (defaultContainer) defaultContainer.style.display = 'block';
};

// Random anime in "All Anime" (Top Trending / New Releases stay the same)
window.refreshAnime = function() {
    const icon = document.querySelector('#refresh-btn .f-icon');
    if (icon) {
        icon.parentElement.classList.remove('spinning');
        void icon.getBoundingClientRect();
        icon.parentElement.classList.add('spinning');
    }

    window.resetFilters();

    const searchContainer = $('search-results-container');
    if (searchContainer) searchContainer.style.display = 'none';

    loadAllAnimePage(Math.floor(Math.random() * Math.min(totalPages, 66)) + 1);
};

if ($('filter-load-more')) $('filter-load-more').addEventListener('click', loadFilterBatch);

const searchInputElem = document.getElementById('search-input');

if (searchInputElem) {
    searchInputElem.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        const suggestionsBox = document.getElementById('search-suggestions');

        if (!query) {
            suggestionsBox.style.display = 'none';
            suggestionsBox.innerHTML = '';

            return;
        }

        try {
            const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&nsfw=true&page[limit]=8`);

            const data = await res.json();

            if (data.data && data.data.length > 0) {
                suggestionsBox.innerHTML = '';
                suggestionsBox.style.display = 'block';

                data.data.forEach(anime => {
                    const attr = anime.attributes;
                    const rawTitle = attr.canonicalTitle || attr.titles.en_jp || attr.titles.en || 'Unknown Anime';
                    const safeTitle = rawTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const poster = attr.posterImage ? attr.posterImage.small : 'https://via.placeholder.com/50x70?text=No+Img';
                    const rating = attr.averageRating ? (attr.averageRating / 10).toFixed(1) : '8.0';
                    const slug = anime.slug;

                    const itemHTML = `
                        <div class="suggestion-item" onclick="handleAnimeClick('${slug}', '${safeTitle}', '${poster}', '${rating}')">
                            <img src="${poster}" alt="${rawTitle}" class="suggestion-poster">
                            <div class="suggestion-info">
                                <div class="suggestion-title">${rawTitle}</div>
                                <div class="suggestion-rating">★ ${rating}</div>
                            </div>
                        </div>
                    `;

                    suggestionsBox.innerHTML += itemHTML;
                });

            } else {
                suggestionsBox.style.display = 'block';
                suggestionsBox.innerHTML = '<div style="padding: 12px; color: #aaa; text-align: center; font-size: 13px;">No anime found</div>';
            }

        } catch (err) {
            console.error('Search suggestion error:', err);
        }
    });
}

// Called from onkeyup in HTML (suggestions are handled by the 'input' listener above)
window.handleSearch = function() {};

const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;

if (searchInputElem) {
    searchInputElem.addEventListener('focus', () => {
        const box = document.getElementById('search-suggestions');
        if (isDesktop() && box && box.innerHTML.trim() && searchInputElem.value.trim()) {
            box.style.display = 'block';
        }
    });
}

// Desktop: click outside the search bar closes the suggestions dropdown
document.addEventListener('click', (e) => {
    if (!isDesktop()) return;
    if (e.target.closest('#search-bar-container') || e.target.closest('#search-suggestions')) return;

    const box = document.getElementById('search-suggestions');
    if (box) box.style.display = 'none';
});

window.handleAnimeClick = async function(slug, title, poster, rating, episode) {
    const user = auth.currentUser;

    if (!slug) return;

    localStorage.setItem('currentAnimeSlug', slug);

    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);

            const docSnap = await getDoc(userDocRef);
            let existingHistory = [];

            if (docSnap.exists() && docSnap.data().watchHistory) {
                const currentHistory = docSnap.data().watchHistory;

                if (Array.isArray(currentHistory)) {
                    existingHistory = currentHistory.filter(item => item && item.id !== slug);
                }
            }

            const dateObj = new Date();
            const dateStr = `${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getMonth() + 1).padStart(2, '0')} ${dateObj.getFullYear()}`;

            const newHistoryItem = {
                id: slug,
                title: title || 'Unknown Anime',
                rating: rating || '8.0',
                type: 'TV',
                country: 'Japan',
                image: poster || '',
                timestamp: dateObj.getTime(),
                dateStr: dateStr
            };

            const updatedHistory = [newHistoryItem, ...existingHistory];

            if (updatedHistory.length > 50) {
                updatedHistory.length = 50;
            }

            await setDoc(userDocRef, { watchHistory: updatedHistory }, { merge: true });

            await new Promise(resolve => setTimeout(resolve, 350));

        } catch (error) {
            console.error("Error saving click history to Firebase:", error);
        }
    }

    const watchUrl = new URL('watch.html', window.location.href);

    watchUrl.searchParams.set('anime', slug);

    if (title) watchUrl.searchParams.set('title', title);

    // optional: episode number (used by the Estimated Schedule)
    if (episode) watchUrl.searchParams.set('ep', episode);

    window.location.href = watchUrl.href;
};

document.addEventListener('DOMContentLoaded', () => {
    loadHomeAnime();
    loadAllAnimePage(1);

    const welcomeAudio = document.getElementById('welcomeAudio');

    if (welcomeAudio && !sessionStorage.getItem('welcomeAudioPlayed')) {
        welcomeAudio.play().then(() => {
            sessionStorage.setItem('welcomeAudioPlayed', 'true');

        }).catch(error => {
            const playOnInteraction = () => {
                welcomeAudio.play().then(() => {
                    sessionStorage.setItem('welcomeAudioPlayed', 'true');
                    document.removeEventListener('click', playOnInteraction);

                }).catch(e => console.log(e));
            };

            document.addEventListener('click', playOnInteraction);
        });
    }
});

// Real-time Background Activity Tracker
setInterval(() => {
    const user = auth.currentUser;

    if (user) {
        let currentSeconds = parseInt(sessionStorage.getItem(`pixelPlayTime_${user.uid}`)) || 0;

        currentSeconds++;

        sessionStorage.setItem(`pixelPlayTime_${user.uid}`, currentSeconds);
    }
}, 1000);

/* ===================== ESTIMATED SCHEDULE (AniList airing schedule) ===================== */
(function () {
    const ANILIST_URL = 'https://graphql.anilist.co';
    const MAX_OFFSET = 7;                       // how many days back / forward the arrows go
    const QUERY = `
        query ($start: Int, $end: Int, $page: Int) {
            Page(page: $page, perPage: 50) {
                pageInfo { hasNextPage }
                airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
                    airingAt
                    episode
                    media { id isAdult title { romaji english } }
                }
            }
        }`;

    const dayList = document.getElementById('sch-day-list');
    const listEl = document.getElementById('sch-list');
    const nowEl = document.getElementById('sch-now');
    const prevBtn = document.getElementById('sch-prev');
    const nextBtn = document.getElementById('sch-next');
    if (!dayList || !listEl) return;

    const cache = {};          // dayKey -> array of airing items
    let offset = 0;            // 0 = today
    let requestId = 0;

    const dayDate = (off) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
    const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const fmtTime = (ts) => new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    function tickClock() {
        if (nowEl) nowEl.textContent = '- Now: ' + new Date().toLocaleString('en-US');
    }

    function renderDays() {
        dayList.innerHTML = '';
        [-1, 0, 1].forEach((delta) => {
            const off = offset + delta;
            const d = dayDate(off);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'sch-day' + (delta === 0 ? ' active' : '');
            btn.innerHTML = '<small></small><b></b>';
            btn.querySelector('small').textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
            btn.querySelector('b').textContent = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            if (off < -MAX_OFFSET || off > MAX_OFFSET) btn.style.visibility = 'hidden';
            else btn.addEventListener('click', () => selectDay(off));
            dayList.appendChild(btn);
        });
        prevBtn.disabled = offset <= -MAX_OFFSET;
        nextBtn.disabled = offset >= MAX_OFFSET;
    }

    async function fetchDay(off) {
        const start = Math.floor(dayDate(off).getTime() / 1000);
        const end = Math.floor(dayDate(off + 1).getTime() / 1000);
        let items = [];
        for (let page = 1; page <= 8; page++) {
            const res = await fetch(ANILIST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ query: QUERY, variables: { start: start - 1, end: end, page } })
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            const data = json.data && json.data.Page;
            if (!data) break;
            items = items.concat(data.airingSchedules || []);
            if (!data.pageInfo.hasNextPage) break;
        }
        return items.filter(i => i.media && !i.media.isAdult);
    }

    function fmtLeft(sec) {
        const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.max(1, Math.floor((sec % 3600) / 60));
        if (d > 0) return d + 'd ' + h + 'h';
        if (h > 0) return h + 'h ' + m + 'm';
        return m + 'm';
    }

    let toastTimer = null;
    function showToast(msg) {
        let t = document.getElementById('sch-toast');
        if (!t) { t = document.createElement('div'); t.id = 'sch-toast'; t.className = 'sch-toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
    }

    // rows switch from "upcoming" to "aired" by themselves while the page stays open
    setInterval(() => {
        const nowTs = Date.now() / 1000;
        listEl.querySelectorAll('.sch-item').forEach((r) => {
            const aired = Number(r.dataset.airing) <= nowTs;
            r.classList.toggle('past', aired);
            r.classList.toggle('upcoming', !aired);
        });
    }, 30000);

    function renderList(items) {
        listEl.innerHTML = '';
        if (!items.length) {
            listEl.innerHTML = '<div class="sch-msg">No episodes scheduled for this day.</div>';
            return;
        }
        const nowTs = Date.now() / 1000;
        items.forEach((it) => {
            const title = it.media.title.english || it.media.title.romaji || 'Unknown';
            const row = document.createElement('div');
            row.className = 'sch-item ' + (it.airingAt <= nowTs ? 'past' : 'upcoming');
            row.dataset.airing = it.airingAt;

            const time = document.createElement('div');
            time.className = 'sch-time';
            time.textContent = fmtTime(it.airingAt);

            const ep = document.createElement('div');
            ep.className = 'sch-ep';
            ep.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20"/></svg><span></span>';
            ep.querySelector('span').textContent = 'Episode ' + it.episode;

            const name = document.createElement('div');
            name.className = 'sch-name';
            name.textContent = title;

            row.append(time, ep, name);
            row.addEventListener('click', () => {
                // only episodes that have already aired can be opened (checked at click time)
                const left = it.airingAt - Date.now() / 1000;
                if (left > 0) { showToast("This episode hasn't aired yet. It will be available in " + fmtLeft(left) + '.'); return; }
                openAnime(it.media.id, it.media.title.romaji || title, title, it.episode, row);
            });
            listEl.appendChild(row);
        });
    }

    // AniList ids differ from Kitsu ids, so the matching Kitsu anime is looked up first by
    // its AniList id (exact match) and, if that fails, by name. If both fail, the watch page
    // is opened with a slug made from the title so the click never ends up doing nothing.
    async function kitsuGet(url) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } finally {
            clearTimeout(timer);
        }
    }

    async function findKitsuAnime(anilistId, searchName) {
        try {
            const m = await kitsuGet(`https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${anilistId}&include=item`);
            const item = (m.included || []).find(x => x.type === 'anime');
            if (item) return item;
        } catch (e) { console.warn('Kitsu mapping lookup failed:', e); }

        try {
            const r = await kitsuGet(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(searchName)}&page[limit]=1`);
            if (r.data && r.data[0]) return r.data[0];
        } catch (e) { console.warn('Kitsu search failed:', e); }

        return null;
    }

    const slugify = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    async function openAnime(anilistId, searchName, displayName, episode, rowEl) {
        if (rowEl && rowEl.dataset.opening) return;          // ignore double taps
        const timeEl = rowEl && rowEl.querySelector('.sch-time');
        const oldTime = timeEl ? timeEl.textContent : '';
        if (rowEl) { rowEl.dataset.opening = '1'; rowEl.style.opacity = '0.6'; if (timeEl) timeEl.textContent = 'Opening...'; }

        try {
            const a = await findKitsuAnime(anilistId, searchName);

            if (a) {
                const attr = a.attributes;
                const poster = attr.posterImage ? attr.posterImage.medium : '';
                const rating = attr.averageRating ? (attr.averageRating / 10).toFixed(1) : '8.0';
                await window.handleAnimeClick(a.attributes.slug || a.slug, attr.canonicalTitle || displayName, poster, rating, episode);
            } else {
                const url = new URL('watch.html', window.location.href);
                url.searchParams.set('anime', slugify(searchName));
                url.searchParams.set('title', displayName);
                if (episode) url.searchParams.set('ep', episode);
                window.location.href = url.href;
            }
        } catch (e) {
            console.error('Schedule open error:', e);
            alert("Couldn't open this anime. Please try again.");
        } finally {
            if (rowEl) { delete rowEl.dataset.opening; rowEl.style.opacity = ''; if (timeEl) timeEl.textContent = oldTime; }
        }
    }

    async function selectDay(off) {
        offset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, off));
        renderDays();

        const key = dayKey(dayDate(offset));
        const myId = ++requestId;

        if (cache[key]) { renderList(cache[key]); return; }

        listEl.innerHTML = '<div class="sch-msg">Loading...</div>';
        try {
            const items = await fetchDay(offset);
            cache[key] = items;
            if (myId === requestId) renderList(items);
        } catch (e) {
            console.error('Schedule fetch error:', e);
            if (myId === requestId) listEl.innerHTML = '<div class="sch-msg">Could not load the schedule. Please try again.</div>';
        }
    }

    prevBtn.addEventListener('click', () => selectDay(offset - 1));
    nextBtn.addEventListener('click', () => selectDay(offset + 1));

    tickClock();
    setInterval(tickClock, 1000);
    selectDay(0);
})();
