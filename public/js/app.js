/* =========================================================
   ShopVerse — Core App Logic (Navigation, API, Utils)
   ========================================================= */

const API_BASE = '';
let currentPage = 'home';
let currentCategory = 'All';
let searchTimeout = null;

// ---- API Helper ----
async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(API_BASE + url, { ...options, headers: { ...headers, ...options.headers } });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }
    return data;
}

// ---- Navigation ----
function navigateTo(page, productId = null) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const target = document.getElementById(`page-${page}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = page;

        // Hide footer on auth pages
        const footer = document.getElementById('main-footer');
        if (footer) {
            footer.style.display = ['login', 'register'].includes(page) ? 'none' : '';
        }

        if (page === 'home') loadProducts(currentCategory === 'All' ? null : currentCategory);
        if (page === 'categories') loadCategories();
        if (page === 'product-detail' && productId) loadProductDetail(productId);
        if (page === 'cart') renderCart();
        if (page === 'checkout') renderCheckout();
        if (page === 'orders') loadOrders();
        if (page === 'profile') renderProfile();
    }
}

function setActiveNav(el) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');
}

// ---- Mobile Menu ----
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    const menu = document.getElementById('mobile-menu');
    const searchBar = document.getElementById('mobile-search-bar');
    menu.classList.toggle('hidden');
    searchBar.classList.add('hidden');
    updateMobileAuth();
});

function closeMobileMenu() {
    document.getElementById('mobile-menu').classList.add('hidden');
    document.getElementById('mobile-search-bar').classList.add('hidden');
}

function toggleMobileSearch() {
    const sb = document.getElementById('mobile-search-bar');
    const mm = document.getElementById('mobile-menu');
    sb.classList.toggle('hidden');
    mm.classList.add('hidden');
    if (!sb.classList.contains('hidden')) {
        document.getElementById('mobile-search-input').focus();
    }
}

// ---- Search ----
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');

searchInput.addEventListener('input', function () {
    const val = this.value.trim();
    searchClear.style.display = val ? 'block' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (val) {
            if (currentPage !== 'home') navigateTo('home');
            loadProducts(null, val);
        } else {
            loadProducts();
        }
    }, 350);
});

document.getElementById('mobile-search-input').addEventListener('input', function () {
    const val = this.value.trim();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (currentPage !== 'home') navigateTo('home');
        loadProducts(null, val || null);
        if (val) closeMobileMenu();
    }, 350);
});

function clearSearch() {
    searchInput.value = '';
    searchClear.style.display = 'none';
    loadProducts(currentCategory === 'All' ? null : currentCategory);
}

// ---- Category Filter ----
function filterByCategory(category, pillEl) {
    currentCategory = category;
    searchInput.value = '';
    searchClear.style.display = 'none';

    // Update pill active state
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    if (pillEl) pillEl.classList.add('active');
    else {
        const targetPill = document.querySelector(`.pill[data-category="${category}"]`);
        if (targetPill) targetPill.classList.add('active');
    }

    loadProducts(category === 'All' ? null : category);
}

// ---- Sort Handler ----
function handleSort() {
    const sort = document.getElementById('sort-select').value;
    const grid = document.getElementById('products-grid');
    const cards = Array.from(grid.children);
    if (!cards.length) return;

    cards.sort((a, b) => {
        const priceA = parseFloat(a.dataset.price || 0);
        const priceB = parseFloat(b.dataset.price || 0);
        const ratingA = parseFloat(a.dataset.rating || 0);
        const ratingB = parseFloat(b.dataset.rating || 0);
        const dateA = new Date(a.dataset.date || 0);
        const dateB = new Date(b.dataset.date || 0);

        if (sort === 'price-low') return priceA - priceB;
        if (sort === 'price-high') return priceB - priceA;
        if (sort === 'rating') return ratingB - ratingA;
        return dateB - dateA;
    });
    cards.forEach(c => grid.appendChild(c));
}

// ---- Dropdown ----
const userMenuBtn = document.getElementById('user-menu-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
if (userMenuBtn) {
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('open');
        const chevron = userMenuBtn.querySelector('.chevron');
        if (chevron) chevron.style.transform = dropdownMenu.classList.contains('open') ? 'rotate(180deg)' : '';
    });
}
document.addEventListener('click', () => {
    if (dropdownMenu) dropdownMenu.classList.remove('open');
});

// ---- Render Stars ----
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return `${'<i class="fas fa-star star-full"></i>'.repeat(full)}${half ? '<i class="fas fa-star-half-alt star-half"></i>' : ''}${'<i class="far fa-star star-empty"></i>'.repeat(empty)}`;
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span class="toast-msg">${message}</span>
        <i class="fas fa-times toast-close" onclick="this.parentElement.remove()"></i>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3500);
}

// ---- Toggle Password Visibility ----
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.innerHTML = `<i class="fas ${isPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
}

// ---- Mobile Auth Links ----
function updateMobileAuth() {
    const container = document.getElementById('mobile-auth-links');
    if (!container) return;
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
        container.innerHTML = `
            ${user.isAdmin ? `<a href="/admin" style="color:var(--accent);font-weight:700"><i class="fas fa-shield-alt"></i> Admin Panel</a>` : ''}
            <a href="#" onclick="navigateTo('orders'); closeMobileMenu()"><i class="fas fa-box"></i> My Orders</a>
            <a href="#" onclick="navigateTo('profile'); closeMobileMenu()"><i class="fas fa-user"></i> Profile</a>
            <a href="#" onclick="handleLogout(); closeMobileMenu()" style="color: var(--danger)"><i class="fas fa-sign-out-alt"></i> Logout</a>
        `;
    } else {
        container.innerHTML = `
            <a href="#" onclick="navigateTo('login'); closeMobileMenu()"><i class="fas fa-sign-in-alt"></i> Login</a>
            <a href="#" onclick="navigateTo('register'); closeMobileMenu()"><i class="fas fa-user-plus"></i> Sign Up</a>
        `;
    }
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    loadProducts();
    updateMobileAuth();
});
