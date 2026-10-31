import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

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

let currentUser = null;
let activeFilter = 'today';
let searchOpen = false;
let sidebarOpen = false;

window.toggleSearch = function() {
    const searchBar = document.getElementById('search-bar-container');
    const overlay = document.getElementById('screen-overlay');
    const sidebar = document.getElementById('sidebar');

    if (sidebarOpen && sidebar) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const emptyState = document.getElementById('emptyState');
    const historyContent = document.getElementById('historyContent');
    const historyList = document.getElementById('historyList');
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterToday = document.getElementById('filterToday');
    const filterLast7Days = document.getElementById('filterLast7Days');
    const deleteAllTrigger = document.getElementById('deleteAllTrigger');
    const deleteModal = document.getElementById('deleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            fetchAndRenderHistory();
        } else {
            window.location.href = 'login.html';
        }
    });

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (menuToggleBtn && filterDropdown && !menuToggleBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.remove('active');
        }
    });

    if (filterToday) {
        filterToday.addEventListener('click', () => {
            activeFilter = 'today';
            filterToday.classList.add('active');
            if (filterLast7Days) filterLast7Days.classList.remove('active');
            if (filterDropdown) filterDropdown.classList.remove('active');
            fetchAndRenderHistory();
        });
    }

    if (filterLast7Days) {
        filterLast7Days.addEventListener('click', () => {
            activeFilter = 'last7days';
            filterLast7Days.classList.add('active');
            if (filterToday) filterToday.classList.remove('active');
            if (filterDropdown) filterDropdown.classList.remove('active');
            fetchAndRenderHistory();
        });
    }

    if (deleteAllTrigger) {
        deleteAllTrigger.addEventListener('click', async () => {
            if (!currentUser) return;
            const history = await getUserHistoryData();
            if (history.length > 0 && deleteModal) {
                deleteModal.classList.add('active');
            }
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            if (deleteModal) deleteModal.classList.remove('active');
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!currentUser) return;
            await saveUserHistoryData([]);
            if (deleteModal) deleteModal.classList.remove('active');
            fetchAndRenderHistory();
        });
    }

    async function getUserHistoryData() {
        if (!currentUser) return [];
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().watchHistory) {
                return docSnap.data().watchHistory;
            }
        } catch (err) {
            console.error("Error fetching history from Firestore:", err);
        }
        return [];
    }

    async function saveUserHistoryData(historyArray) {
        if (!currentUser) return;
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await setDoc(userDocRef, { watchHistory: historyArray }, { merge: true });
        } catch (err) {
            console.error("Error saving history to Firestore:", err);
        }
    }

    async function fetchAndRenderHistory() {
        let history = await getUserHistoryData();
        const now = new Date().getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * oneDayMs;

        history = history.map(item => {
            if (!item.timestamp) {
                item.timestamp = now;
            }
            if (!item.dateStr) {
                const d = new Date(item.timestamp);
                item.dateStr = `${String(d.getDate()).padStart(2, '0')} ${String(d.getMonth() + 1).padStart(2, '0')} ${d.getFullYear()}`;
            }
            return item;
        });

        // 7 din se purane items automatically remove karne ka logic
        history = history.filter(item => (now - item.timestamp) <= sevenDaysMs);
        await saveUserHistoryData(history);

        let filtered = history.filter(item => {
            const diff = now - item.timestamp;
            if (activeFilter === 'today') {
                return diff <= oneDayMs;
            } else {
                return diff <= sevenDaysMs;
            }
        });

        if (filtered.length === 0 && history.length > 0) {
            filtered = history;
        }

        if (filtered.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            if (historyContent) historyContent.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (historyContent) historyContent.style.display = 'block';

            const groups = {};
            filtered.forEach(item => {
                const dStr = item.dateStr || 'Recent';
                if (!groups[dStr]) groups[dStr] = [];
                groups[dStr].push(item);
            });

            if (historyList) {
                historyList.innerHTML = '';

                Object.keys(groups).forEach(dateStr => {
                    const dateHeader = document.createElement('div');
                    dateHeader.className = 'date-header';
                    dateHeader.innerText = dateStr;
                    historyList.appendChild(dateHeader);

                    groups[dateStr].forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'anime-card';
                        card.innerHTML = `
                            <img src="${item.image}" class="anime-thumb" alt="${item.title}">
                            <div class="anime-info">
                                <div class="anime-title">${item.title}</div>
                                <div class="anime-meta">
                                    <span class="rating">★ ${item.rating}</span> | ${item.type || 'TV'} | ${item.country || 'Japan'}
                                </div>
                                <div class="card-actions">
                                    <button class="action-btn rewatch-btn" data-id="${item.id}">Rewatch</button>
                                    <button class="action-btn item-delete-btn" data-id="${item.id}">Delete</button>
                                </div>
                            </div>
                        `;
                        historyList.appendChild(card);
                    });
                });

                document.querySelectorAll('.rewatch-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const animeId = e.target.getAttribute('data-id');
                        window.location.href = `watch.html?anime=${animeId}`;
                    });
                });

                document.querySelectorAll('.item-delete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const animeId = e.target.getAttribute('data-id');
                        let currentHistory = await getUserHistoryData();
                        currentHistory = currentHistory.filter(item => item.id !== animeId);
                        await saveUserHistoryData(currentHistory);
                        fetchAndRenderHistory();
                    });
                });
            }
        }
    }
});

// Real-time Background Activity Timer Loop (Account & Session based)
setInterval(() => {
    const user = auth.currentUser;
    if (user) {
        let currentSeconds = parseInt(sessionStorage.getItem(`pixelPlayTime_${user.uid}`)) || 0;
        currentSeconds++;
        sessionStorage.setItem(`pixelPlayTime_${user.uid}`, currentSeconds);
    }
}, 1000);
