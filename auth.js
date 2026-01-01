// Authentication Logic
console.log("auth.js loaded");

let isSigningUp = false;

// 1. Handle Page Protection & Redirects
auth.onAuthStateChanged(user => {
    console.log("Auth state changed:", user ? "logged in" : "logged out", user?.email);
    if (isSigningUp) return; // Prevent premature redirect during signup flow

    const path = window.location.pathname;
    const page = path.split("/").pop();
    const isLoginPage = page === "index.html" || page === "";

    if (user) {
        // If logged in and on login page, go to dashboard
        if (isLoginPage) {
            console.log("Redirecting to dashboard");
            window.location.href = "dashboard.html";
        }
    } else {
        // If not logged in and NOT on login page, go to login
        if (!isLoginPage) {
            console.log("Redirecting to login");
            window.location.href = "index.html";
        }
    }
});

// 2. Handle Login Page Logic (Only runs if elements exist)
const loginForm = document.getElementById('loginForm');
const signupFormElement = document.getElementById('signupFormElement');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');

if (loginForm) {
    // Toggle Forms
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const loginContainer = loginForm.closest('.auth-form') || loginForm;
        loginContainer.classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signupForm').classList.add('hidden');
        const loginContainer = loginForm.closest('.auth-form') || loginForm;
        loginContainer.classList.remove('hidden');
    });

    // Login Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .catch(error => showNotification(error.message, 'error'));
    });

    // Signup Submit
    signupFormElement.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        isSigningUp = true; // Set flag to pause auto-redirect

        auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                // Create user document
                return db.collection('users').doc(cred.user.uid).set({
                    email: email,
                    createdAt: new Date(),
                    role: 'admin' // Default role
                });
            })
            .then(() => {
                window.location.href = "dashboard.html"; // Redirect only after DB write is complete
            })
            .catch(error => {
                isSigningUp = false; // Reset flag on error
                showNotification(error.message, 'error');
            });
    });
}

// 3. Handle Logout (Global)
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = "index.html";
        });
    });
}