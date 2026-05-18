let isLogin = false;

function toggleAuth() {
    isLogin = !isLogin;
    
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btn = document.getElementById('auth-btn');
    const nameField = document.getElementById('name-field');
    const toggleDesc = document.getElementById('toggle-desc');
    const toggleAction = document.getElementById('toggle-action');

    if (isLogin) {
        title.innerText = "Welcome Back";
        subtitle.innerText = "Log in to manage your appointments";
        btn.innerHTML = '<span>Login</span> <i class="fas fa-sign-in-alt"></i>';
        nameField.style.display = "none";
        toggleDesc.innerText = "Don't have an account?";
        toggleAction.innerText = "Sign Up";
    } else {
        title.innerText = "Create Account";
        subtitle.innerText = "Join our academic community today";
        btn.innerHTML = '<span>Sign Up</span> <i class="fas fa-arrow-right"></i>';
        nameField.style.display = "block";
        toggleDesc.innerText = "Already have an account?";
        toggleAction.innerText = "Login";
    }
}

// Show/Hide Password logic
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
const authForm = document.getElementById('auth-form');
const errorMessage = document.getElementById('error-message');

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.innerText = "";
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const type = isLogin ? 'login' : 'signup';

    // Create the data object to send
    let authData = { email, password };

    // Only add Name and Role if we are SIGNING UP[cite: 12]
    if (!isLogin) {
        authData.name = document.getElementById('name').value;
        authData.role = document.getElementById('role').value;
        
        if (!authData.role) {
            errorMessage.innerText = "Please select a role";
            return;
        }
    }

    try {
        const response = await fetch(`http://localhost:5000/api/auth/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authData) // Send the correct data[cite: 12]
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Success!");
            if (isLogin) {
                localStorage.setItem('token', data.token); // Save the VIP pass[cite: 5, 12]
                localStorage.setItem('role', data.role);
                
                // Redirect based on role[cite: 5, 12]
                window.location.href = data.role === 'teacher' ? 'teacher.html' : 'student.html';
            } else {
                toggleAuth(); // Switch to login view after signup[cite: 12]
            }
        } else {
            errorMessage.innerText = data.message;
        }
    } catch (err) {
        errorMessage.innerText = "Cannot connect to server. Is it running?";
    }
});