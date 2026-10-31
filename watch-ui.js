
import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
    getAuth,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA7vBJKtJ0iY61y-3iqCvKByIThAzYOF0o",
    authDomain: "pixelplay-8ac18.firebaseapp.com",
    projectId: "pixelplay-8ac18",
    storageBucket: "pixelplay-8ac18.firebasestorage.app",
    messagingSenderId: "965382522854",
    appId: "1:965382522854:web:914d76200b0798d6d1f827",
    measurementId: "G-NSGMLJ94G4"
};

// Prevent duplicate Firebase initialization
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
let animeSlug = params.get('anime') || localStorage.getItem('currentAnimeSlug');

let searchOpen = false;
let sidebarOpen = false;
let searchTimer = null;

let currentAnimeData = null;
let currentGenres = [];

const $ = id => document.getElementById(id);

/* -------------------------------
   SEARCH / SIDEBAR
-------------------------------- */

window.toggleSearch = function () {
    const searchBar = $('search-bar-container');
    const overlay = $('screen-overlay');
    const sidebar = $('sidebar');

    if (sidebarOpen && sidebar) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        sidebarOpen = false;
    }

    if (!searchOpen) {
        if (searchBar) searchBar.style.display = 'flex';
        if (overlay) overlay.style.display = 'block';

        $('search-input')?.focus();

        searchOpen = true;
    } else {
        window.closeEverything();
    }
};

window.toggleSidebar = function () {
    const sidebar = $('sidebar');
    const overlay = $('screen-overlay');
    const searchBar = $('search-bar-container');
    const suggestions = $('search-suggestions');

    if (searchOpen) {
        if (searchBar) searchBar.style.display = 'none';
        if (suggestions) suggestions.style.display = 'none';

        searchOpen = false;
    }

    if (!sidebarOpen) {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.style.display = 'block';

        document.body.classList.add('sidebar-open');
        sidebarOpen = true;
    } else {
        window.closeEverything();
    }
};

window.closeEverything = function () {
    const searchBar = $('search-bar-container');
    const suggestions = $('search-suggestions');
    const sidebar = $('sidebar');
    const overlay = $('screen-overlay');

    if (searchBar) searchBar.style.display = 'none';
    if (suggestions) suggestions.style.display = 'none';
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.style.display = 'none';

    document.body.classList.remove('sidebar-open');

    searchOpen = false;
    sidebarOpen = false;
};

window.clearSearchInput = function () {
    const input = $('search-input');
    const box = $('search-suggestions');

    if (input) input.value = '';

    if (box) {
        box.style.display = 'none';
        box.innerHTML = '';
    }
};

/* -------------------------------
   PROFILE / LOGOUT
-------------------------------- */

window.handleProfileClick = function () {
    window.location.href = auth.currentUser
        ? 'profile.html'
        : 'login.html';
};

window.handleLogoutClick = function () {
    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }

    sessionStorage.clear();

    signOut(auth).then(() => {
        window.location.reload();
    }).catch(error => {
        console.error('Logout error:', error);
    });
};

/* -------------------------------
   SAVE ANIME
-------------------------------- */

async function updateSavedButton() {
    if (!currentAnimeData) return;

    const user = auth.currentUser;
    let saved = false;

    if (user) {
        try {
            const ref = doc(
                db,
                'users',
                user.uid,
                'savedAnime',
                currentAnimeData.slug
            );

            const snapshot = await getDoc(ref);
            saved = snapshot.exists();

        } catch (error) {
            console.error('Saved anime check failed:', error);
        }
    }

    const button = $('save-anime-btn');
    const label = $('save-label');

    if (button) {
        button.classList.toggle('saved', saved);
        button.setAttribute('aria-pressed', String(saved));
    }

    if (label) {
        label.textContent = saved ? 'Saved' : 'Save';
    }
}

onAuthStateChanged(auth, () => {
    updateSavedButton();
});

function showToast() {
    const toast = $('toast-popup');
    if (!toast) return;

    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

$('save-anime-btn')?.addEventListener('click', async () => {
    if (!currentAnimeData) {
        alert('Anime information is still loading.');
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        if (confirm('You must be logged in to save anime. Go to Login?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    const ref = doc(
        db,
        'users',
        user.uid,
        'savedAnime',
        currentAnimeData.slug
    );

    try {
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
            await deleteDoc(ref);
        } else {
            await setDoc(ref, {
                id: currentAnimeData.id,
                slug: currentAnimeData.slug,
                title: currentAnimeData.title,
                poster: currentAnimeData.poster,
                rating: currentAnimeData.rating,
                type: currentAnimeData.type,
                savedAt: Date.now()
            });

            showToast();
        }

        await updateSavedButton();

    } catch (error) {
        console.error('Save anime error:', error);
        alert('Failed to update saved anime. Please check your internet connection.');
    }
});

/* -------------------------------
   RECEIVE ANIME DATA
-------------------------------- */

function handleAnimeLoaded(event) {
    const data = event.detail;

    if (!data) return;

    currentAnimeData = data.animeData;
    currentGenres = data.genres || [];
    animeSlug = data.slug || animeSlug;

    updateSavedButton();
    loadRecommendations();
}

window.addEventListener('pixelplay:anime-loaded', handleAnimeLoaded);

// watch.js may execute before this module.
// Read the saved data if the event has already fired.
if (window.pixelPlayAnimeData) {
    handleAnimeLoaded({
        detail: window.pixelPlayAnimeData
    });
}

/* -------------------------------
   RECOMMENDATIONS
-------------------------------- */

function titleOf(item) {
    const a = item?.attributes || {};
    const t = a.titles || {};

    return a.canonicalTitle ||
        t.en ||
        t.en_jp ||
        t.ja_jp ||
        'Anime';
}

async function loadRecommendations() {
    const grid = $('recommendation-grid');
    if (!grid) return;

    try {
        let items = [];

        const genre = currentGenres[0];

        if (genre) {
            const url =
                'https://kitsu.io/api/edge/anime?filter[categories]=' +
                encodeURIComponent(genre) +
                '&page[limit]=20&sort=-averageRating';

            const response = await fetch(url);
            const data = await response.json();

            items = (data.data || []).filter(item =>
                item.attributes &&
                item.attributes.showType !== 'music'
            );
        }

        if (items.length < 15) {
            const response = await fetch(
                'https://kitsu.io/api/edge/anime?sort=-averageRating&page[limit]=25'
            );

            const data = await response.json();

            const moreItems = (data.data || []).filter(item =>
                item.attributes &&
                item.attributes.showType !== 'music'
            );

            items = items.concat(moreItems);
        }

        const seen = new Set([animeSlug]);

        items = items.filter(item => {
            const slug = item.attributes?.slug;

            if (!slug || seen.has(slug)) return false;

            seen.add(slug);
            return true;
        });

        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        items = items.slice(0, 15);
        grid.innerHTML = '';

        if (!items.length) {
            grid.innerHTML =
                '<div class="recommendation-empty">No recommendations available right now.</div>';
            return;
        }

        items.forEach(item => {
            const a = item.attributes || {};
            const name = titleOf(item);

            const imageUrl =
                a.posterImage?.large ||
                a.posterImage?.medium ||
                '';

            const card = document.createElement('a');

            card.className = 'recommendation-card';
            card.href =
                `watch.html?anime=${encodeURIComponent(a.slug || '')}` +
                `&title=${encodeURIComponent(name)}`;

            const image = document.createElement('img');
            image.loading = 'lazy';
            image.alt = name;
            image.src = imageUrl;

            const title = document.createElement('div');
            title.className = 'rec-title';
            title.textContent = name;

            const meta = document.createElement('div');
            meta.className = 'rec-meta';

            meta.textContent =
                (a.showType || 'Anime').toUpperCase() +
                (a.averageRating
                    ? ' · ★ ' + (Number(a.averageRating) / 10).toFixed(1)
                    : '');

            card.append(image, title, meta);
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Recommendations error:', error);

        grid.innerHTML =
            '<div class="recommendation-empty">Could not load recommendations.</div>';
    }
}

/* -------------------------------
   TOP TRENDING
-------------------------------- */

async function loadTopTrendingAnime() {
    const container = $('top-trending-container');
    if (!container) return;

    const masterAnimeList = [
        { title: 'Attack on Titan', slug: 'attack-on-titan', poster: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', rating: '9.1', type: 'TV' },
        { title: 'Fullmetal Alchemist: Brotherhood', slug: 'fullmetal-alchemist-brotherhood', poster: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg', rating: '9.2', type: 'TV' },
        { title: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen', poster: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', rating: '8.7', type: 'TV' },
        { title: 'Demon Slayer', slug: 'kimetsu-no-yaiba', poster: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', rating: '8.8', type: 'TV' },
        { title: 'Solo Leveling', slug: 'ore-dake-level-up-na-ken', poster: 'https://cdn.myanimelist.net/images/anime/1389/140412.jpg', rating: '8.6', type: 'TV' },
        { title: "Frieren: Beyond Journey's End", slug: 'sousou-no-frieren', poster: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', rating: '9.1', type: 'TV' },
        { title: 'Death Note', slug: 'death-note', poster: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg', rating: '8.8', type: 'TV' },
        { title: 'Steins;Gate', slug: 'steins-gate', poster: 'https://cdn.myanimelist.net/images/anime/5/73199.jpg', rating: '9.0', type: 'TV' },
        { title: 'Hunter x Hunter', slug: 'hunter-x-hunter-2011', poster: 'https://cdn.myanimelist.net/images/anime/1337/99013.jpg', rating: '9.0', type: 'TV' },
        { title: 'One Piece', slug: 'one-piece', poster: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', rating: '8.7', type: 'TV' },
        { title: 'Chainsaw Man', slug: 'chainsaw-man', poster: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', rating: '8.5', type: 'TV' },
        { title: 'Vinland Saga', slug: 'vinland-saga', poster: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg', rating: '8.9', type: 'TV' },
        { title: 'Bleach', slug: 'bleach', poster: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg', rating: '8.0', type: 'TV' },
        { title: 'Naruto: Shippuden', slug: 'naruto-shippuden', poster: 'https://cdn.myanimelist.net/images/anime/5/17407.jpg', rating: '8.3', type: 'TV' },
        { title: 'Blue Lock', slug: 'blue-lock', poster: 'https://cdn.myanimelist.net/images/anime/1258/126929.jpg', rating: '8.3', type: 'TV' }
    ];

    try {
        const today = new Date().toISOString().slice(0, 10);

        let seed = 0;
        for (const char of today) {
            seed += char.charCodeAt(0);
        }

        const items = [...masterAnimeList].sort((a, b) => {
            return (
                (a.slug.charCodeAt(0) + seed) % 100 -
                (b.slug.charCodeAt(0) + seed) % 100
            );
        });

        container.innerHTML = '';

        items.slice(0, 10).forEach(item => {
            const card = document.createElement('a');

            card.className = 'trending-item-card';
            card.href =
                `watch.html?anime=${encodeURIComponent(item.slug)}` +
                `&title=${encodeURIComponent(item.title)}` +
                `&rating=${encodeURIComponent(item.rating)}`;

            card.innerHTML = `
                <img class="trending-poster"
                     src="${item.poster}"
                     alt="${item.title}"
                     loading="lazy">

                <div class="trending-info">
                    <div class="trending-title">${item.title}</div>

                    <div class="trending-meta">
                        <span class="trending-rating">★ ${item.rating}</span>
                        <span>·</span>
                        <span>${item.type}</span>
                        <span>·</span>
                        <span>Japan</span>
                    </div>

                    <div class="trending-badges">
                        <span class="badge-tag">HD</span>
                        <span class="badge-tag">CC</span>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error('Trending error:', error);

        container.innerHTML =
            '<div class="recommendation-empty">Could not load trending anime.</div>';
    }
}

/* -------------------------------
   WATCH PAGE SEARCH
-------------------------------- */

window.handleWatchSearch = function (value) {
    clearTimeout(searchTimer);

    const box = $('search-suggestions');
    if (!box) return;

    const query = String(value || '').trim();

    if (query.length < 2) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }

    searchTimer = setTimeout(async () => {
        try {
            const response = await fetch(
                'https://kitsu.io/api/edge/anime?filter[text]=' +
                encodeURIComponent(query) +
                '&page[limit]=7'
            );

            const data = await response.json();

            box.innerHTML = '';

            const results = (data.data || []).filter(item =>
                item.attributes &&
                item.attributes.showType !== 'music'
            );

            results.forEach(item => {
                const a = item.attributes || {};
                const name = titleOf(item);

                const link = document.createElement('a');

                link.className = 'watch-search-result';
                link.href =
                    'watch.html?anime=' +
                    encodeURIComponent(a.slug || '') +
                    '&title=' +
                    encodeURIComponent(name);

                const image = document.createElement('img');

                image.src =
                    a.posterImage?.small ||
                    a.posterImage?.medium ||
                    '';

                image.alt = '';

                const title = document.createElement('span');
                title.textContent = name;

                link.append(image, title);
                box.appendChild(link);
            });

            box.style.display = results.length ? 'block' : 'none';

        } catch (error) {
            console.error('Search error:', error);
            box.style.display = 'none';
        }

    }, 300);
};

document.addEventListener('click', event => {
    const box = $('search-suggestions');
    const input = $('search-input');

    if (
        box &&
        input &&
        !box.contains(event.target) &&
        event.target !== input
    ) {
        box.style.display = 'none';
    }
});

/* -------------------------------
   INFO PANEL
-------------------------------- */

$('info-toggle')?.addEventListener('click', function () {
    const expanded = this.getAttribute('aria-expanded') === 'true';

    this.setAttribute('aria-expanded', String(!expanded));

    if ($('anime-info-panel')) {
        $('anime-info-panel').hidden = expanded;
    }
});

/* -------------------------------
   ACCOUNT WATCH TIME
-------------------------------- */

setInterval(() => {
    const user = auth.currentUser;

    if (!user) return;

    const key = `pixelPlayTime_${user.uid}`;

    let seconds = parseInt(sessionStorage.getItem(key), 10) || 0;

    seconds++;

    sessionStorage.setItem(key, seconds);
}, 1000);

/* -------------------------------
   RATING DISPLAY GUARD
-------------------------------- */

setInterval(() => {
    const rating = params.get('rating') || '8.8';

    const animeRating = $('anime-rating');
    const detailRating = $('detail-rating');

    if (animeRating && animeRating.textContent.includes('0.0')) {
        animeRating.textContent = `★ ${rating}`;
    }

    if (detailRating && detailRating.textContent.includes('0.0')) {
        detailRating.textContent = `★ ${rating}`;
    }
}, 100);

loadTopTrendingAnime();
