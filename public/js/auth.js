/* =========================================================
   ShopVerse — Authentication Logic
   ========================================================= */

let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// ---- Check Auth State on Load ----
function checkAuthState() {
    if (currentUser) updateAuthUI();
}

// ---- Update Auth UI ----
function updateAuthUI() {
    const loggedOut = document.getElementById('nav-auth-logged-out');
    const loggedIn = document.getElementById('nav-auth-logged-in');

    if (currentUser) {
        if (loggedOut) loggedOut.classList.add('hidden');
        if (loggedIn) loggedIn.classList.remove('hidden');

        const nameEl = document.getElementById('user-name-display');
        if (nameEl) nameEl.textContent = currentUser.name.split(' ')[0];

        const avatarEl = document.getElementById('user-avatar-nav');
        if (avatarEl) avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();

        // Add admin link to dropdown if user is admin
        const menu = document.getElementById('dropdown-menu');
        if (menu && currentUser.isAdmin) {
            if (!document.getElementById('nav-admin-link')) {
                const adminLink = document.createElement('a');
                adminLink.id = 'nav-admin-link';
                adminLink.href = '/admin';
                adminLink.innerHTML = '<i class="fas fa-shield-alt"></i> Admin Panel';
                adminLink.style.color = 'var(--accent)';
                adminLink.style.fontWeight = '700';
                menu.insertBefore(adminLink, menu.firstChild);
            }
        }
    } else {
        if (loggedOut) loggedOut.classList.remove('hidden');
        if (loggedIn) loggedIn.classList.add('hidden');

        // Remove admin link if it exists
        const adminLink = document.getElementById('nav-admin-link');
        if (adminLink) adminLink.remove();
    }
    updateMobileAuth();
}

// ---- Login ----
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const messageEl = document.getElementById('login-message');
    const btn = document.getElementById('login-btn');

    messageEl.className = 'form-message';
    messageEl.textContent = '';

    if (!email || !password) {
        messageEl.className = 'form-message error';
        messageEl.textContent = 'Please fill in all fields';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    try {
        const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        currentUser = data;
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        updateAuthUI();
        showToast(`Welcome back, ${data.name}! 👋`, 'success');
        document.getElementById('login-form').reset();

        if (data.isAdmin) {
            // Save admin session for the dashboard
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data));
            window.location.href = '/admin';
        } else {
            navigateTo('home');
        }

    } catch (error) {
        messageEl.className = 'form-message error';
        messageEl.textContent = error.message;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
}

// ---- Register ----
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const messageEl = document.getElementById('register-message');
    const btn = document.getElementById('register-btn');

    messageEl.className = 'form-message';
    messageEl.textContent = '';

    if (!name || !email || !password || !confirmPassword) {
        messageEl.className = 'form-message error';
        messageEl.textContent = 'Please fill in all fields';
        return;
    }

    if (password.length < 6) {
        messageEl.className = 'form-message error';
        messageEl.textContent = 'Password must be at least 6 characters';
        return;
    }

    if (password !== confirmPassword) {
        messageEl.className = 'form-message error';
        messageEl.textContent = 'Passwords do not match';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

    try {
        const data = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        currentUser = data;
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        updateAuthUI();
        showToast('Account created successfully! 🎉', 'success');
        document.getElementById('register-form').reset();

        if (data.isAdmin) {
            // Save admin session for the dashboard
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data));
            window.location.href = '/admin';
        } else {
            navigateTo('home');
        }

    } catch (error) {
        messageEl.className = 'form-message error';
        messageEl.textContent = error.message;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
}

// ---- Logout ----
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    updateAuthUI();
    showToast('You have been logged out', 'info');
    navigateTo('home');
}

// ---- Profile ----
function renderProfile() {
    if (!currentUser) { navigateTo('login'); return; }
    const content = document.getElementById('profile-content');
    if (!content) return;

    const initial = currentUser.name.charAt(0).toUpperCase();
    content.innerHTML = `
        <div class="profile-avatar-section">
            <div class="profile-avatar">${initial}</div>
            <div class="profile-info">
                <h2>${currentUser.name}</h2>
                <p>${currentUser.email}</p>
                <div class="profile-badge">
                    <i class="fas ${currentUser.isAdmin ? 'fa-shield-alt' : 'fa-user'}"></i>
                    ${currentUser.isAdmin ? 'Admin' : 'Customer'}
                </div>
            </div>
        </div>
        <div class="product-detail-meta">
            <div class="meta-row">
                <span class="meta-label">Full Name</span>
                <span class="meta-value">${currentUser.name}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Email</span>
                <span class="meta-value">${currentUser.email}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Account Type</span>
                <span class="meta-value">${currentUser.isAdmin ? 'Administrator' : 'Customer'}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Member Since</span>
                <span class="meta-value">March 2026</span>
            </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap">
            ${currentUser.isAdmin ? `
                <button class="btn btn-primary" onclick="window.location.href='/admin'" style="background:var(--accent);box-shadow:0 4px 12px var(--accent-glow)">
                    <i class="fas fa-shield-alt"></i> Admin Dashboard
                </button>
            ` : ''}
            <button class="btn btn-primary" onclick="navigateTo('orders')">
                <i class="fas fa-box"></i> My Orders
            </button>
            <button class="btn btn-danger" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
    `;
}
