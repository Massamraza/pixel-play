import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect, getRedirectResult, GoogleAuthProvider, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');
const authContainer = document.getElementById('authContainer');
const resetModal = document.getElementById('resetModal');
const closeModalBtn = document.getElementById('closeModalBtn');

let generatedOtp = '';
let savedUsername = '';
let savedEmail = '';
let savedPassword = '';

// Notification record karne ka main function
async function recordLoginNotification(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        
        let existingNotifs = [];
        if (docSnap.exists() && docSnap.data().notifications) {
            existingNotifs = docSnap.data().notifications;
        }

        const dateObj = new Date();
        const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

        const newNotification = {
            dateStr: dateStr,
            timestamp: dateObj.getTime()
        };

        const updatedNotifs = [newNotification, ...existingNotifs];

        await setDoc(userDocRef, { notifications: updatedNotifs }, { merge: true });
    } catch (err) {
        console.error("Error recording login notification:", err);
    }
}

// Check if user just returned from Google Redirect flow
getRedirectResult(auth)
    .then(async (result) => {
        if (result && result.user) {
            await recordLoginNotification(result.user.uid);
            window.location.href = 'home.html';
        }
    }).catch((error) => {
        console.error("Redirect login error:", error.message);
        if (error.message && errorMsg) {
            errorMsg.innerText = error.message;
        }
    });

document.getElementById('toRegister').addEventListener('click', () => {
    errorMsg.innerText = '';
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    document.getElementById('regStep1').style.display = 'block';
    document.getElementById('regStep2').style.display = 'none';
});

document.getElementById('toLogin').addEventListener('click', () => {
    errorMsg.innerText = '';
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
});

// Password Show/Hide Toggle Logic
const setupPasswordToggle = (toggleId, inputId) => {
    const toggleIcon = document.getElementById(toggleId);
    const passwordInput = document.getElementById(inputId);

    toggleIcon.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.style.stroke = '#ff0000';
        } else {
            passwordInput.type = 'password';
            toggleIcon.style.stroke = '#888';
        }
    });
};

setupPasswordToggle('toggleLoginPass', 'loginPass');
setupPasswordToggle('toggleRegPass', 'regPass');

// Google Sign-In Logic for Login
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    try {
        await signInWithRedirect(auth, googleProvider);
    } catch (error) {
        errorMsg.innerText = error.message;
    }
});

// Google Sign-In Logic for Register
document.getElementById('googleRegisterBtn').addEventListener('click', async () => {
    try {
        await signInWithRedirect(auth, googleProvider);
    } catch (error) {
        errorMsg.innerText = error.message;
    }
});

// Forget Password Logic with Modal Popup
document.getElementById('forgotPassLink').addEventListener('click', async (e) => {
    e.preventDefault();
    const userInput = document.getElementById('loginUser').value.trim();

    if (!userInput) {
        errorMsg.innerText = "Please enter your email or username above first!";
        return;
    }

    const emailToReset = userInput.includes('@') ? userInput : `${userInput}@pixelplay.com`;

    try {
        await sendPasswordResetEmail(auth, emailToReset);
        errorMsg.innerText = '';
        authContainer.classList.add('blurred');
        resetModal.classList.add('active');
    } catch (error) {
        errorMsg.innerText = error.message;
    }
});

closeModalBtn.addEventListener('click', () => {
    authContainer.classList.remove('blurred');
    resetModal.classList.remove('active');
});

// Step 1: Send OTP via EmailJS before registering
document.getElementById('sendOtpBtn').addEventListener('click', async () => {
    savedUsername = document.getElementById('regUser').value.trim();
    savedEmail = document.getElementById('regEmail').value.trim();
    savedPassword = document.getElementById('regPass').value.trim();

    if (!savedUsername || !savedEmail || !savedPassword) {
        errorMsg.innerText = "Please fill all fields!";
        return;
    }

    errorMsg.innerText = "Sending verification code...";
    document.getElementById('sendOtpBtn').disabled = true;

    generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const serviceID = 'service_mrytope';
    const templateID = 'template_jkagjf7';
    const publicKey = 'Pt2u1fi5yWplTghN4';

    const templateParams = {
        to_email: savedEmail,
        pass_code: generatedOtp
    };

    try {
        await emailjs.send(serviceID, templateID, templateParams, publicKey);
        errorMsg.innerText = '';
        document.getElementById('regStep1').style.display = 'none';
        document.getElementById('regStep2').style.display = 'block';
    } catch (error) {
        console.error("EmailJS Error:", error);
        errorMsg.innerText = "Failed to send verification code. Check EmailJS keys.";
    } finally {
        document.getElementById('sendOtpBtn').disabled = false;
    }
});

// Back button from Step 2 to Step 1
document.getElementById('backToRegStep1').addEventListener('click', () => {
    errorMsg.innerText = '';
    document.getElementById('regStep2').style.display = 'none';
    document.getElementById('regStep1').style.display = 'block';
});

// Step 2: Verify OTP and Create Firebase Account
document.getElementById('verifyAndRegisterBtn').addEventListener('click', async () => {
    const enteredOtp = document.getElementById('enteredOtp').value.trim();

    if (!enteredOtp) {
        errorMsg.innerText = "Please enter the verification code!";
        return;
    }

    if (enteredOtp !== generatedOtp) {
        errorMsg.innerText = "Invalid verification code. Please try again.";
        return;
    }

    try {
        errorMsg.innerText = "Creating account...";
        const userCredential = await createUserWithEmailAndPassword(auth, savedEmail, savedPassword);
        await updateProfile(userCredential.user, { displayName: savedUsername });
        
        await recordLoginNotification(userCredential.user.uid);

        window.location.href = 'home.html';
    } catch (error) {
        errorMsg.innerText = error.message;
    }
});

// Login Logic (Email / Username & Password)
document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value.trim();

    if (!username || !password) {
        errorMsg.innerText = "Please enter username and password!";
        return;
    }

    const formattedEmail = username.includes('@') ? username : `${username}@pixelplay.com`;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
        
        await recordLoginNotification(userCredential.user.uid);

        window.location.href = 'home.html';
    } catch (error) {
        errorMsg.innerText = error.message;
    }
});

// Real-time Background Activity Tracker (Account & Session based)
setInterval(() => {
    const user = auth.currentUser;
    if (user) {
        let currentSeconds = parseInt(sessionStorage.getItem(`pixelPlayTime_${user.uid}`)) || 0;
        currentSeconds++;
        sessionStorage.setItem(`pixelPlayTime_${user.uid}`, currentSeconds);
    }
}, 1000);
