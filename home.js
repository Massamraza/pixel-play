import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
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
    if (categoryContainer) categoryContainer.style.display = 'none';
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
    if (categoryContainer) categoryContainer.style.display = 'none';
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

        const newRes = await fetch(`https://kitsu.io/api/edge/anime?page[limit]=10&sort=-startDate&nsfw=true`);
        const newData = await newRes.json();
        renderGrid(newData.data, 'new-releases-grid');

    } catch (error) {
        console.error('Error loading home anime:', error);
    }
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

let pageOffset = 0;
const limitPerPage = 12;
let isLoading = false;
let hasMoreData = true;

async function loadAllAnime(isReset = false) {
    if (isLoading || (!hasMoreData && !isReset)) return;

    isLoading = true;

    if (isReset) {
        pageOffset = 0;
        hasMoreData = true;

        const grid = document.getElementById('anime-grid');
        if (grid) grid.innerHTML = '';
    }

    const scrollLoader = document.getElementById('scroll-loader');
    if (scrollLoader) scrollLoader.style.display = 'block';

    try {
        const apiUrl = `https://kitsu.io/api/edge/anime?page[limit]=${limitPerPage}&page[offset]=${pageOffset}&sort=-userCount&nsfw=true`;

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!result.data || result.data.length === 0) {
            hasMoreData = false;

            if (scrollLoader) scrollLoader.style.display = 'none';

            return;
        }

        const grid = document.getElementById('anime-grid');

        if (grid) {
            result.data.forEach(anime => {
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

        pageOffset += limitPerPage;
        isLoading = false;

        if (scrollLoader) scrollLoader.style.display = 'none';

    } catch (error) {
        console.error('Error loading All Anime:', error);

        isLoading = false;

        if (scrollLoader) scrollLoader.style.display = 'none';
    }
}

window.filterByCategory = async function(categoryName, pillElement) {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));

    if (pillElement) pillElement.classList.add('active');

    const defaultContainer = document.getElementById('default-sections-container');
    const categoryContainer = document.getElementById('category-section-container');
    const searchContainer = document.getElementById('search-results-container');
    const allAnimeContainer = document.getElementById('all-anime-container');

    if (searchContainer) searchContainer.style.display = 'none';

    if (categoryName === 'All') {
        if (defaultContainer) defaultContainer.style.display = 'block';
        if (categoryContainer) categoryContainer.style.display = 'none';
        if (allAnimeContainer) allAnimeContainer.style.display = 'block';

        return;
    }

    if (defaultContainer) defaultContainer.style.display = 'none';
    if (allAnimeContainer) allAnimeContainer.style.display = 'none';
    if (categoryContainer) categoryContainer.style.display = 'block';

    const catTitleElem = document.getElementById('category-section-title');

    if (catTitleElem) catTitleElem.innerText = categoryName;

    const categoryGrid = document.getElementById('category-grid');

    if (categoryGrid) {
        categoryGrid.innerHTML = '<p style="color: #888; grid-column: 1/-1; text-align: center; padding: 20px;">Loading...</p>';
    }

    const categorySlugs = {
        'Action': 'action',
        'Romantic': 'romance',
        'Adventure': 'adventure'
    };

    const catSlug = categorySlugs[categoryName] || categoryName.toLowerCase().trim();

    try {
        const res = await fetch(`https://kitsu.io/api/edge/anime?filter[categories]=${catSlug}&nsfw=true&page[limit]=18&sort=-userCount`);

        const data = await res.json();

        if (categoryGrid) {
            renderGrid(data.data, 'category-grid');
        }

    } catch (err) {
        console.error('Category fetch error:', err);

        if (categoryGrid) {
            categoryGrid.innerHTML = '<p style="color: #ff6b6b; grid-column: 1/-1; text-align: center; padding: 20px;">Failed to load category.</p>';
        }
    }
};

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

window.handleAnimeClick = async function(slug, title, poster, rating) {
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

    window.location.href = watchUrl.href;
};

window.addEventListener('scroll', () => {
    const allAnimeContainer = document.getElementById('all-anime-container');

    if (allAnimeContainer && allAnimeContainer.style.display !== 'none') {
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 300) {
            loadAllAnime(false);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadHomeAnime();
    loadAllAnime(true);

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