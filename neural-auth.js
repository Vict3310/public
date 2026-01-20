// Enhanced Neural Authentication System
class NeuralAuth {
    constructor() {
        this.setupEventListeners();
        this.setupFormSwitching();
        this.setupPasswordToggle();
        this.setupLoadingStates();
        // Hide loading immediately
        this.hideLoading();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Signup form
        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Reset password form
        document.getElementById('resetPasswordForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordReset();
        });

        // Google login
        document.querySelector('[data-google-login]')?.addEventListener('click', () => {
            this.handleGoogleLogin();
        });
    }

    setupFormSwitching() {
        // Show signup form
        document.getElementById('showSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('signup');
        });

        // Show login form
        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('login');
        });

        // Show forgot password
        document.getElementById('forgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('forgot');
        });

        // Back to login
        document.getElementById('backToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('login');
        });
    }

    setupPasswordToggle() {
        document.getElementById('togglePassword').addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const toggleBtn = document.getElementById('togglePassword');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = '👁️';
            }
        });
    }

    setupLoadingStates() {
        // Add neural loading effects to forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', () => {
                this.showLoading();
            });
        });
    }

    switchForm(formType) {
        // Hide all forms
        document.getElementById('loginFormContainer').classList.add('hidden');
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('forgotPasswordForm')?.classList.add('hidden');

        // Show selected form with animation
        setTimeout(() => {
            switch(formType) {
                case 'signup':
                    document.getElementById('signupForm').classList.remove('hidden');
                    break;
                case 'forgot':
                    document.getElementById('forgotPasswordForm')?.classList.remove('hidden');
                    break;
                default:
                    document.getElementById('loginFormContainer').classList.remove('hidden');
            }
        }, 150);
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            this.showLoading('Establishing neural connection...');
            
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            
            if (rememberMe) {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            }

            this.showToast('Neural access granted! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'neural-dashboard.html';
            }, 2000);

        } catch (error) {
            this.hideLoading();
            this.showToast(this.getErrorMessage(error.code), 'error');
        }
    }

    async handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const businessName = document.getElementById('businessName').value;

        try {
            this.showLoading('Creating neural profile...');
            
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update user profile
            await userCredential.user.updateProfile({
                displayName: name
            });

            // Store additional user data
            await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                businessName: businessName || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                neuralProfile: true
            });

            this.showToast('Neural profile activated! Welcome to the matrix...', 'success');
            
            setTimeout(() => {
                window.location.href = 'neural-dashboard.html';
            }, 2000);

        } catch (error) {
            this.hideLoading();
            this.showToast(this.getErrorMessage(error.code), 'error');
        }
    }

    async handlePasswordReset() {
        const email = document.getElementById('resetEmail').value;

        try {
            this.showLoading('Transmitting recovery signal...');
            
            await firebase.auth().sendPasswordResetEmail(email);
            
            this.hideLoading();
            this.showToast('Recovery signal transmitted! Check your neural inbox.', 'success');
            
            setTimeout(() => {
                this.switchForm('login');
            }, 3000);

        } catch (error) {
            this.hideLoading();
            this.showToast(this.getErrorMessage(error.code), 'error');
        }
    }

    async handleGoogleLogin() {
        try {
            this.showLoading('Connecting to Google Neural Network...');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            
            // Store user data if new user
            const userDoc = await firebase.firestore().collection('users').doc(result.user.uid).get();
            
            if (!userDoc.exists) {
                await firebase.firestore().collection('users').doc(result.user.uid).set({
                    name: result.user.displayName,
                    email: result.user.email,
                    businessName: '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    neuralProfile: true,
                    googleAuth: true
                });
            }

            this.showToast('Google Neural connection established!', 'success');
            
            setTimeout(() => {
                window.location.href = 'neural-dashboard.html';
            }, 2000);

        } catch (error) {
            this.hideLoading();
            this.showToast(this.getErrorMessage(error.code), 'error');
        }
    }

    showLoading(message = 'Initializing Neural Network...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = overlay.querySelector('p');
        messageEl.textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const messageEl = document.getElementById('toastMessage');
        
        messageEl.textContent = message;
        
        // Set toast style based on type
        if (type === 'error') {
            toast.style.background = 'var(--danger)';
            toast.style.borderColor = 'var(--danger)';
        } else if (type === 'warning') {
            toast.style.background = 'var(--warning)';
            toast.style.borderColor = 'var(--warning)';
        } else {
            toast.style.background = 'var(--success)';
            toast.style.borderColor = 'var(--success)';
        }
        
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'Neural ID not found in the matrix',
            'auth/wrong-password': 'Invalid access key detected',
            'auth/email-already-in-use': 'Neural ID already exists in the matrix',
            'auth/weak-password': 'Security protocol too weak',
            'auth/invalid-email': 'Invalid neural ID format',
            'auth/too-many-requests': 'Too many connection attempts. Neural firewall activated.',
            'auth/network-request-failed': 'Neural network connection failed'
        };
        
        return errorMessages[errorCode] || 'Neural system error occurred';
    }
}

// Initialize Neural Auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NeuralAuth();
});

// Add neural form label animations
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.form-neural input');
    
    inputs.forEach(input => {
        // Handle focus and blur for floating labels
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // Check if input has value on load
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
});