import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

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
const auth = getAuth(app);

let searchOpen = false;
let sidebarOpen = false;

window.toggleSearch = function() {
    const searchBar = document.getElementById('search-bar-container');
    const overlay = document.getElementById('screen-overlay');
    const sidebar = document.getElementById('sidebar');
    const switchLine = document.getElementById('switch-line');

    if (sidebarOpen && sidebar) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
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
}

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
}

window.closeEverything = function() {
    const searchBar = document.getElementById('search-bar-container');
    const suggestions = document.getElementById('search-suggestions');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('screen-overlay');

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

    searchOpen = false;
    sidebarOpen = false;
}

window.clearSearchInput = function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    const suggestionsBox = document.getElementById('search-suggestions');
    if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
        suggestionsBox.innerHTML = '';
    }
    if (searchInput) searchInput.focus();
}

window.handleProfileClick = function() {
    if (auth.currentUser) {
        window.location.href = 'profile.html';
    } else {
        window.location.href = 'login.html';
    }
}

window.handleLogoutClick = function() {
    if (auth.currentUser) {
        sessionStorage.clear();
        signOut(auth).then(() => {
            window.location.reload();
        });
    } else {
        window.location.href = 'login.html';
    }
}

// Live Kitsu Search Suggestions
const searchInputElem = document.getElementById('search-input');
if (searchInputElem) {
    searchInputElem.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        const suggestionsBox = document.getElementById('search-suggestions');

        if (!query) {
            if (suggestionsBox) {
                suggestionsBox.style.display = 'none';
                suggestionsBox.innerHTML = '';
            }
            return;
        }

        try {
            const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&nsfw=true&page[limit]=8`);
            const data = await res.json();

            if (data.data && data.data.length > 0) {
                if (suggestionsBox) {
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.style.display = 'block';

                    data.data.forEach(anime => {
                        const attr = anime.attributes;
                        const rawTitle = attr.canonicalTitle || attr.titles.en_jp || attr.titles.en || 'Unknown Anime';
                        const poster = attr.posterImage ? attr.posterImage.small : 'blank.jpg';
                        const rating = attr.averageRating ? (attr.averageRating / 10).toFixed(1) : '8.0';
                        const slug = anime.slug;

                        const itemHTML = `
                            <div class="suggestion-item" onclick="window.location.href='watch.html?anime=${slug}'" style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #222;">
                                <img src="${poster}" alt="${rawTitle}" style="width: 35px; height: 50px; object-fit: cover; border-radius: 4px;">
                                <div style="display: flex; flex-direction: column; gap: 3px;">
                                    <div style="font-size: 13px; font-weight: 600; color: #ffffff;">${rawTitle}</div>
                                    <div style="font-size: 11px; color: #4dc4d4;">★ ${rating}</div>
                                </div>
                            </div>
                        `;
                        suggestionsBox.innerHTML += itemHTML;
                    });
                }
            } else {
                if (suggestionsBox) {
                    suggestionsBox.style.display = 'block';
                    suggestionsBox.innerHTML = '<div style="padding: 12px; color: #aaa; text-align: center; font-size: 13px;">No anime found</div>';
                }
            }
        } catch (err) {
            console.error('Search error:', err);
        }
    });
}

// Real-time Background Activity Timer Loop (Account & Session based)
setInterval(() => {
    const user = auth.currentUser;
    if (user) {
        let currentSeconds = parseInt(sessionStorage.getItem(`pixelPlayTime_${user.uid}`)) || 0;
        currentSeconds++;
        sessionStorage.setItem(`pixelPlayTime_${user.uid}`, currentSeconds);
    }
}, 1000);
