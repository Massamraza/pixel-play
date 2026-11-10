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
let secondsSpent = 0;
let targetSeconds = 0;
let timerInterval = null;
let popupShownToday = false;

let selectedHours = 1;
let selectedMinutes = 30;

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
    }
}

window.selectTime = function(type, val) {
    if (type === 'hours') {
        selectedHours = parseInt(val);
        document.querySelectorAll('#hours-group .time-pill').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.getAttribute('data-val')) === selectedHours);
        });
    } else if (type === 'minutes') {
        selectedMinutes = parseInt(val);
        document.querySelectorAll('#minutes-group .time-pill').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.getAttribute('data-val')) === selectedMinutes);
        });
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        // Session storage se is user ka time uthayein (real-time tracking ke liye)
        secondsSpent = parseInt(sessionStorage.getItem(`pixelPlayTime_${user.uid}`)) || 0;
        
        await loadUserReminder();
        startRealTimeTracking();
    } else {
        window.location.href = 'login.html';
    }
});

async function loadUserReminder() {
    if (!currentUser) return;
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.reminderTarget !== undefined) {
                targetSeconds = data.reminderTarget;
                selectedHours = Math.floor(targetSeconds / 3600);
                selectedMinutes = Math.floor((targetSeconds % 3600) / 60);

                window.selectTime('hours', selectedHours);
                window.selectTime('minutes', selectedMinutes);

                if (targetSeconds > 0) {
                    const statusElem = document.getElementById('reminder-status');
                    if (statusElem) statusElem.innerText = `Active Reminder: ${selectedHours}h ${selectedMinutes}m`;
                }
            }
            if (data.popupShownToday !== undefined) {
                popupShownToday = data.popupShownToday;
            }
        }
        updateDisplayTime();
    } catch (err) {
        console.error("Error loading reminder:", err);
    }
}

function startRealTimeTracking() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(async () => {
        secondsSpent++;
        sessionStorage.setItem(`pixelPlayTime_${currentUser.uid}`, secondsSpent);
        updateDisplayTime();

        // Agar reminder target complete ho jaye
        if (targetSeconds > 0 && secondsSpent >= targetSeconds && !popupShownToday) {
            popupShownToday = true;
            targetSeconds = 0; // Reminder reset to 0
            
            const statusElem = document.getElementById('reminder-status');
            if (statusElem) statusElem.innerText = `Reminder completed & reset`;
            
            await saveReminderToFirebase();
            showCustomPopup("Time Limit Reached!", "You set time has been completed.", "alarm");
        }
    }, 1000);
}

function updateDisplayTime() {
    const hours = Math.floor(secondsSpent / 3600);
    const minutes = Math.floor((secondsSpent % 3600) / 60);
    const secs = secondsSpent % 60;

    let text = '';
    if (hours > 0) text += `${hours}h `;
    text += `${minutes}m ${secs}s`;

    const timeElem = document.getElementById('total-time-text');
    if (timeElem) timeElem.innerText = text;
}

async function saveReminderToFirebase() {
    if (!currentUser) return;
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, { 
            reminderTarget: targetSeconds,
            popupShownToday: popupShownToday
        }, { merge: true });
    } catch (err) {
        console.error("Error saving reminder:", err);
    }
}

window.saveReminderTarget = async function() {
    targetSeconds = (selectedHours * 3600) + (selectedMinutes * 60);
    popupShownToday = false; // Naya reminder set hone par popup dobara allow ho jayega

    const statusElem = document.getElementById('reminder-status');
    if (targetSeconds > 0) {
        if (statusElem) statusElem.innerText = `Reminder set for ${selectedHours}h ${selectedMinutes}m`;
    } else {
        if (statusElem) statusElem.innerText = `Reminder cleared`;
    }

    await saveReminderToFirebase();
    showCustomPopup("Reminder Saved", "Reminder target saved successfully!", "success");
}

function showCustomPopup(title, message, type) {
    const titleElem = document.getElementById('modal-title');
    const msgElem = document.getElementById('popup-message');
    if (titleElem) titleElem.innerText = title;
    if (msgElem) msgElem.innerText = message;
    
    const iconBox = document.getElementById('modal-icon-box');
    if (iconBox) {
        iconBox.className = `alarm-icon-box ${type}`;
        if (type === 'alarm') {
            iconBox.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="13" r="8"></circle>
                    <polyline points="12 9 12 13 15 15"></polyline>
                    <path d="M5 3L2 6"></path>
                    <path d="M19 3l3 3"></path>
                </svg>
            `;
        } else {
            iconBox.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
        }
    }

    const modal = document.getElementById('reminder-popup-modal');
    if (modal) modal.style.display = 'flex';
}

window.closeReminderPopup = function() {
    const modal = document.getElementById('reminder-popup-modal');
    if (modal) modal.style.display = 'none';
}
