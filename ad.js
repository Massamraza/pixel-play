import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

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
    const user = auth.currentUser;
    if (user) {
        window.location.href = 'profile.html';
    } else {
        showLoginRequiredModal();
    }
}

window.handleLogoutClick = function() {
    const user = auth.currentUser;
    if (user) {
        showLogoutConfirmationModal();
    } else {
        showLoginRequiredModal();
    }
}

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

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-alert-modal');
    if (modal) modal.remove();
}

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
                        <div class="suggestion-item" onclick="window.location.href='watch.html?anime=${slug}'">
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

window.goBackHome = function() {
    window.location.href = 'home.html';
}

window.openWhatsApp = function() {
    window.open('https://wa.me/', '_blank');
}

// Real-time Background Activity Tracker (Account & Session based)
setInterval(() => {
    const user = auth.currentUser;
    if (user) {
        let currentSeconds = parseInt(sessionStorage.getItem(`pixelPlayTime_${user.uid}`)) || 0;
        currentSeconds++;
        sessionStorage.setItem(`pixelPlayTime_${user.uid}`, currentSeconds);
    }
}, 1000);
