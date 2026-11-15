
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    updateProfile,
    signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";


// ==========================================
// FIREBASE CONFIGURATION
// ==========================================

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


// ==========================================
// VERIFIED EMAILS
// ==========================================

const VERIFIED_EMAILS = [
    "massamrazam@gmail.com"
];

function positionVerifiedBadge() {
    const input = document.getElementById("profileUser");
    const badge = document.getElementById("verifiedBadge");

    if (!input || !badge || badge.hidden) return;

    const style = window.getComputedStyle(input);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    context.font = style.font;

    const textWidth = context.measureText(input.value || "").width;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;

    const maxLeft = input.clientWidth - badge.offsetWidth - 10;

    const left = Math.min(
        paddingLeft + textWidth + 9,
        maxLeft
    );

    badge.style.left = `${Math.max(paddingLeft, left)}px`;

    badge.style.top = `${
        (input.offsetHeight - badge.offsetHeight) / 2
    }px`;
}

function updateVerifiedBadge(user) {
    const badge = document.getElementById("verifiedBadge");

    if (!badge) return;

    const email = (user?.email || "").trim().toLowerCase();

    const verified = VERIFIED_EMAILS.some(
        approvedEmail => approvedEmail.trim().toLowerCase() === email
    );

    badge.hidden = !verified;

    if (verified) {
        requestAnimationFrame(positionVerifiedBadge);
    }
}


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let searchOpen = false;
let sidebarOpen = false;
let isEditing = false;


// ==========================================
// SEARCH TOGGLE
// ==========================================

window.toggleSearch = function() {
    const searchBar = document.getElementById('search-bar-container');
    const overlay = document.getElementById('screen-overlay');
    const sidebar = document.getElementById('sidebar');

    if (sidebarOpen) {
        if (sidebar) sidebar.classList.remove('active');

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


// ==========================================
// SIDEBAR TOGGLE
// ==========================================

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


// ==========================================
// CLOSE EVERYTHING
// ==========================================

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
};


// ==========================================
// CLEAR SEARCH
// ==========================================

window.clearSearchInput = function() {
    const searchInput = document.getElementById('search-input');

    if (searchInput) searchInput.value = '';

    const suggestionsBox = document.getElementById('search-suggestions');

    if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
        suggestionsBox.innerHTML = '';
    }

    if (searchInput) searchInput.focus();
};


// ==========================================
// AUTH MODALS
// ==========================================

window.handleProfileClick = function() {
    if (auth.currentUser) {
        window.location.href = 'profile.html';
    } else {
        showLoginRequiredModal();
    }
};

window.handleLogoutClick = function() {
    if (auth.currentUser) {
        const profileContainer = document.getElementById('profileContainer');
        const logoutModal = document.getElementById('logoutModal');

        if (profileContainer) profileContainer.classList.add('blurred');
        if (logoutModal) logoutModal.classList.add('active');
    } else {
        showLoginRequiredModal();
    }
};

function showLoginRequiredModal() {
    let existingModal = document.getElementById('auth-alert-modal');

    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="auth-alert-modal"
            style="position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.85);z-index:9999;
            display:flex;align-items:center;justify-content:center;padding:20px;">

            <div style="background:#161616;border:1px solid #333;
                border-radius:12px;padding:25px;max-width:320px;
                width:100%;text-align:center;">

                <h3 style="color:#fff;font-size:18px;margin-bottom:10px;">
                    Authentication Required
                </h3>

                <p style="color:#bbb;font-size:13px;margin-bottom:20px;">
                    Please login first to access your profile and features.
                </p>

                <div style="display:flex;gap:10px;">

                    <button onclick="window.location.href='login.html'"
                        style="background:#ff0000;color:#fff;border:none;
                        padding:10px 16px;border-radius:6px;flex:1;">
                        Login
                    </button>

                    <button onclick="closeAuthModal()"
                        style="background:#333;color:#fff;border:none;
                        padding:10px 16px;border-radius:6px;flex:1;">
                        Cancel
                    </button>

                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-alert-modal');

    if (modal) modal.remove();
};


// ==========================================
// ANIME SEARCH
// ==========================================

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
            const res = await fetch(
                `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&nsfw=true&page[limit]=8`
            );

            const data = await res.json();

            if (data.data && data.data.length > 0) {
                suggestionsBox.innerHTML = '';
                suggestionsBox.style.display = 'block';

                data.data.forEach(anime => {
                    const attr = anime.attributes;

                    const rawTitle =
                        attr.canonicalTitle ||
                        attr.titles.en_jp ||
                        attr.titles.en ||
                        'Unknown Anime';

                    const poster = attr.posterImage
                        ? attr.posterImage.small
                        : 'https://via.placeholder.com/50x70?text=No+Img';

                    const rating = attr.averageRating
                        ? (attr.averageRating / 10).toFixed(1)
                        : '8.0';

                    const slug = anime.slug;

                    const itemHTML = `
                        <div class="suggestion-item"
                            onclick="window.location.href='watch.html?anime=${encodeURIComponent(slug)}'">

                            <img src="${poster}"
                                alt="${rawTitle}"
                                class="suggestion-poster">

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

                suggestionsBox.innerHTML = `
                    <div style="padding:12px;color:#aaa;text-align:center;">
                        No anime found
                    </div>
                `;
            }

        } catch (err) {
            console.error('Search suggestion error:', err);
        }
    });
}


// ==========================================
// PROFILE ELEMENTS
// ==========================================

const profileUser = document.getElementById('profileUser');
const profileEmail = document.getElementById('profileEmail');
const profileImg = document.getElementById('profileImg');

const imageUpload = document.getElementById('imageUpload');

const editBtn = document.getElementById('editBtn');
const logoutBtn = document.getElementById('logoutBtn');

const profileContainer = document.getElementById('profileContainer');
const logoutModal = document.getElementById('logoutModal');

const cancelLogout = document.getElementById('cancelLogout');
const confirmLogout = document.getElementById('confirmLogout');


// ==========================================
// EMAIL FORMAT
// ==========================================

const formatEmail = (email) => {
    if (!email) return "****000@gmail.com";

    const parts = email.split('@');

    const namePart = parts[0];
    const domain = parts[1] || 'gmail.com';

    if (namePart.length <= 3) {
        return `****${namePart}@${domain}`;
    }

    return `****${namePart.slice(-3)}@${domain}`;
};


// ==========================================
// FIREBASE AUTH STATE
// ==========================================

onAuthStateChanged(auth, async (user) => {
    if (user) {

        updateVerifiedBadge(user);

        if (profileUser) {
            profileUser.value = user.displayName || user.email.split('@')[0];

            requestAnimationFrame(positionVerifiedBadge);
        }

        if (profileEmail) {
            const providerId = user.providerData[0]?.providerId;

            if (providerId === 'google.com' && user.email) {
                profileEmail.value = user.email;
            } else {
                profileEmail.value = formatEmail(user.email);
            }
        }

        if (profileImg) {
            try {
                const userDocRef = doc(db, "users", user.uid);

                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists() && userDoc.data().photoURL) {
                    profileImg.src = userDoc.data().photoURL;
                } else if (user.photoURL) {
                    profileImg.src = user.photoURL.replace(/=s96-c/, '=s400-c');
                } else {
                    profileImg.src = 'blank.jpg';
                }

            } catch (err) {
                console.error("Error fetching photo from Firestore:", err);

                profileImg.src = user.photoURL
                    ? user.photoURL.replace(/=s96-c/, '=s400-c')
                    : 'blank.jpg';
            }
        }

    } else {
        window.location.href = 'login.html';
    }
});


// Reposition badge when username changes or screen resizes.
if (profileUser) {
    profileUser.addEventListener("input", positionVerifiedBadge);
    window.addEventListener("resize", positionVerifiedBadge);
}


// ==========================================
// EDIT PROFILE
// ==========================================

if (editBtn) {
    editBtn.addEventListener('click', async () => {

        if (!isEditing) {
            if (profileUser) {
                profileUser.disabled = false;
                profileUser.focus();
            }

            editBtn.innerHTML = `
                Save
                <svg viewBox="0 0 24 24" width="14" height="14"
                    stroke="#fff" fill="none" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;

            isEditing = true;

        } else {
            const newName = profileUser ? profileUser.value.trim() : '';

            if (!newName) {
                alert("Username cannot be empty!");
                return;
            }

            try {
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, {
                        displayName: newName
                    });

                    if (profileUser) profileUser.disabled = true;

                    editBtn.innerHTML = `
                        Edit
                        <svg viewBox="0 0 24 24" width="14" height="14"
                            stroke="#fff" fill="none" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    `;

                    isEditing = false;

                    positionVerifiedBadge();

                    alert("Username updated successfully!");
                }

            } catch (error) {
                alert(error.message);
            }
        }
    });
}


// ==========================================
// PROFILE IMAGE UPLOAD
// ==========================================

if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.src = event.target.result;

            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const maxSize = 250;

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

                if (profileImg) profileImg.src = compressedBase64;

                try {
                    if (auth.currentUser) {
                        const userDocRef = doc(db, "users", auth.currentUser.uid);

                        await setDoc(
                            userDocRef,
                            { photoURL: compressedBase64 },
                            { merge: true }
                        );
                    }

                } catch (error) {
                    console.error("Error saving photo to Firestore:", error);

                    alert("Failed to save picture online: " + error.message);
                }
            };
        };

        reader.readAsDataURL(file);
    });
}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (profileContainer) profileContainer.classList.add('blurred');
        if (logoutModal) logoutModal.classList.add('active');
    });
}

if (cancelLogout) {
    cancelLogout.addEventListener('click', () => {
        if (profileContainer) profileContainer.classList.remove('blurred');
        if (logoutModal) logoutModal.classList.remove('active');
    });
}

if (confirmLogout) {
    confirmLogout.addEventListener('click', async () => {
        try {
            sessionStorage.clear();

            await signOut(auth);

            window.location.href = 'home.html';

        } catch (error) {
            alert(error.message);
        }
    });
}


// ==========================================
// WELCOME AUDIO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const welcomeAudio = document.getElementById('welcomeAudio');

    if (welcomeAudio && !sessionStorage.getItem('welcomeAudioPlayed')) {
        welcomeAudio.play().then(() => {
            sessionStorage.setItem('welcomeAudioPlayed', 'true');

        }).catch(() => {
            const playOnInteraction = () => {
                welcomeAudio.play().then(() => {
                    sessionStorage.setItem('welcomeAudioPlayed', 'true');

                    document.removeEventListener('click', playOnInteraction);
                }).catch(error => console.log(error));
            };

            document.addEventListener('click', playOnInteraction);
        });
    }
});


// ==========================================
// BACKGROUND ACTIVITY TRACKER
// ==========================================

setInterval(() => {
    const user = auth.currentUser;

    if (user) {
        let currentSeconds = parseInt(
            sessionStorage.getItem(`pixelPlayTime_${user.uid}`)
        ) || 0;

        currentSeconds++;

        sessionStorage.setItem(
            `pixelPlayTime_${user.uid}`,
            currentSeconds
        );
    }
}, 1000);
