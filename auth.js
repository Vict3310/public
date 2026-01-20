// Authentication Logic

let isSigningUp = false;

// Wait for Firebase to load
window.addEventListener('load', () => {
    // Ensure Firebase is loaded
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // 1. Handle Page Protection & Redirects
    auth.onAuthStateChanged(async user => {
        if (isSigningUp) return; // Prevent premature redirect during signup flow

        const path = window.location.pathname;
        const page = path.split("/").pop();
        const isLoginPage = page === "index.html" || page === "";
        const isPaymentPage = page === "payment.html";

        if (user) {
            // Check Account Status
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                
                // If accountStatus is undefined, assume active (for existing admin). New users will be 'pending'.
                const isActive = userData?.accountStatus === 'active' || userData?.accountStatus === undefined;

                if (!isActive) {
                    if (!isPaymentPage) {
                        console.log("Account pending, redirecting to payment");
                        window.location.href = "payment.html";
                    }
                } else {
                    // User is active
                    if (isLoginPage || isPaymentPage) {
                        console.log("Redirecting to dashboard");
                        window.location.href = "dashboard.html";
                    }
                }
            } catch (error) {
                console.error("Error checking user status:", error);
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
    const signupForm = document.getElementById('signupForm');
    const showSignupBtn = document.getElementById('showSignup');
    const showLoginBtn = document.getElementById('showLogin');

    if (loginForm) {
        // Toggle Forms
        if (showSignupBtn) {
            showSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('loginCard').classList.add('hidden');
                document.getElementById('signupCard').classList.remove('hidden');
            });
        }

        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('signupCard').classList.add('hidden');
                document.getElementById('loginCard').classList.remove('hidden');
            });
        }

        // Login Submit
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    showNotification('Login successful!', 'success');
                })
                .catch(error => showNotification(error.message, 'error'));
        });

        // Signup Submit
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
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
                            role: 'admin', // Default role
                            accountStatus: 'active' // Set as active for immediate access
                        });
                    })
                    .then(() => {
                        showNotification('Account created successfully!', 'success');
                        window.location.href = "dashboard.html"; // Redirect only after DB write is complete
                    })
                    .catch(error => {
                        isSigningUp = false; // Reset flag on error
                        showNotification(error.message, 'error');
                    });
            });
        }
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
});