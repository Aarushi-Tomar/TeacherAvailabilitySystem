let isLogin = false;
const BASE_URL = window.location.origin;

// ==========================================
// 🔄 VIEWPORT TOGGLE: SIGNUP VS LOGIN VIEW
// ==========================================
function toggleAuth() {
    isLogin = !isLogin;
    
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btn = document.getElementById('auth-btn');
    const nameField = document.getElementById('name-field');
    const toggleDesc = document.getElementById('toggle-desc');
    const toggleAction = document.getElementById('toggle-action');
    const forgotLinkWrapper = document.getElementById('forgot-link-wrapper');

    if (isLogin) {
        title.innerText = "Welcome Back";
        subtitle.innerText = "Log in to manage your appointments";
        btn.innerHTML = '<span>Login</span> <i class="fas fa-sign-out-alt"></i>';
        nameField.style.display = "none";
        toggleDesc.innerText = "Don't have an account?";
        toggleAction.innerText = "Sign Up";
        if (forgotLinkWrapper) forgotLinkWrapper.style.display = "block"; // Reveal Forgot link on login
    } else {
        title.innerText = "Create Account";
        subtitle.innerText = "Join our academic community today";
        btn.innerHTML = '<span>Sign Up</span> <i class="fas fa-arrow-right"></i>';
        nameField.style.display = "block";
        toggleDesc.innerText = "Already have an account?";
        toggleAction.innerText = "Login";
        if (forgotLinkWrapper) forgotLinkWrapper.style.display = "none";  // Hide on signup
    }
}

// ==========================================
// 👁️ OBFUSCATION HOOK: VISIBILITY EYE TOGGLE
// ==========================================
document.getElementById('eye-icon').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        this.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

// ==========================================
// 🗳️ MAIN CORE SUBMISSION: REGISTER & AUTH
// ==========================================
const authForm = document.getElementById('auth-form');
const errorMessage = document.getElementById('error-message');

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.innerText = "";
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const type = isLogin ? 'login' : 'signup';

    if (!role) {
        errorMessage.innerText = "Please explicitly specify your workspace role selection.";
        return;
    }

    // 🛑 CLIENT-SIDE INSTITUTIONAL SECURITY DOMAIN VERIFICATION
    const emailLower = email.toLowerCase();
    if (role === 'teacher' && !emailLower.endsWith('@teacher.edu')) {
        errorMessage.innerText = "Access Forbidden: Teacher profiles require valid @teacher.edu accounts.";
        return;
    }
    if (role === 'student' && !emailLower.endsWith('@student.edu')) {
        errorMessage.innerText = "Access Forbidden: Student dashboards require valid @student.edu accounts.";
        return;
    }

    // Assemble payload containing role validation matching our updated backend controllers
    let authData = { email, password, role };

    if (!isLogin) {
        authData.name = document.getElementById('name').value.trim();
        if (!authData.name) {
            errorMessage.innerText = "Full Name value input required to initialize an account.";
            return;
        }
    }

    try {
        const response = await fetch(`${BASE_URL}/api/auth/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authData)
        });

        const data = await response.json();

        if (response.ok) {
            if (isLogin) {
                // Save context tokens into persistent memory slots
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('email', email.toLowerCase()); // Crucial hydration slot for tracking matrices
                
                // Route entry paths to appropriate view portals
                window.location.href = data.role === 'teacher' ? 'teacher.html' : 'student.html';
            } else {
                alert(data.message || "Registration Successful!");
                toggleAuth(); // Cycle views smoothly over to login view
            }
        } else {
            errorMessage.innerText = data.message;
        }
    } catch (err) {
        errorMessage.innerText = "Cannot secure connection to host server router.";
    }
});

// ==========================================
// 🏢 MODAL CONTROL UTILITIES: FORGOT PASSWORD
// ==========================================
function openForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        document.getElementById('reset-error-message').innerText = "";
        document.getElementById('forgot-password-form').reset();
        modal.style.display = "flex";
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) modal.style.display = "none";
}

// ==========================================
// 🔑 PASSWORD MODAL CALL ROUTINE INTERACTION
// ==========================================
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resetError = document.getElementById('reset-error-message');
    resetError.innerText = "";

    const email = document.getElementById('reset-email').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;

    try {
        const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Credential security update processed successfully!");
            closeForgotPasswordModal();
        } else {
            resetError.style.color = "#ef4444";
            resetError.innerText = data.message;
        }
    } catch (err) {
        resetError.style.color = "#ef4444";
        resetError.innerText = "Failed connection to core security update api.";
    }
});