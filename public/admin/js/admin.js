/* =====================================================
   ShopVerse Admin Dashboard — JavaScript
   ===================================================== */

const API = '';
let adminToken = localStorage.getItem('adminToken') || '';
let adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
let allProducts = [], allOrders = [], allUsers = [], allCategories = [];
let editingProductId = null, editingCategoryId = null;
let deleteAction = null;

// ─── AUTH ────────────────────────────────────────────
async function adminLogin() {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-submit-btn');

    if (!email || !password) { showError(errorEl, 'Please enter email and password'); return; }
    btn.disabled = true;
    btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;margin-right:6px"></div> Signing in...';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        if (!data.isAdmin) throw new Error('Access denied. Admin privileges required.');

        adminToken = data.token;
        adminUser = data;
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data));
        showAdminDashboard();
    } catch (err) {
        showError(errorEl, err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Dashboard';
    }
}

function adminLogout() {
    adminToken = '';
    adminUser = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    document.getElementById('admin-app').classList.add('hidden');
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('admin-email').value = '';
    document.getElementById('admin-password').value = '';
}

function showAdminDashboard() {
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
    if (adminUser) {
        const initial = adminUser.name.charAt(0).toUpperCase();
        document.getElementById('su-avatar').textContent = initial;
        document.getElementById('su-name').textContent = adminUser.name;
        document.getElementById('tu-avatar').textContent = initial;
        document.getElementById('tu-name').textContent = adminUser.name.split(' ')[0];
    }
    loadDashboard();
}

// Check if already logged in
if (adminToken && adminUser && adminUser.isAdmin) {
    showAdminDashboard();
}

// ─── API HELPER ──────────────────────────────────────
async function adminAPI(url, options = {}) {
    const res = await fetch(API + url, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`, ...options.headers }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

// ─── NAVIGATION ──────────────────────────────────────
function navigateAdmin(page, linkEl) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    if (linkEl) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        linkEl.classList.add('active');
    } else {
        document.querySelectorAll(`[data-page="${page}"]`).forEach(el => el.classList.add('active'));
    }

    const names = { dashboard: 'Dashboard', products: 'Products', categories: 'Categories', orders: 'Orders', users: 'Users' };
    document.getElementById('breadcrumb').textContent = names[page] || page;

    if (page === 'dashboard') loadDashboard();
    if (page === 'products') loadProducts();
    if (page === 'categories') loadCategories();
    if (page === 'orders') loadOrders();
    if (page === 'users') loadUsers();

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('mobile-open');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('admin-main');
    if (window.innerWidth <= 900) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('collapsed');
        main.classList.toggle('expanded');
    }
}

// ─── DASHBOARD ───────────────────────────────────────
async function loadDashboard() {
    try {
        const stats = await adminAPI('/api/admin/stats');

        // Update stat cards
        document.getElementById('stat-revenue').textContent = '$' + (stats.totalRevenue || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('stat-revenue-sub').textContent = `+$${(stats.recentRevenue || 0).toFixed(2)} this week`;
        document.getElementById('stat-orders').textContent = stats.totalOrders || 0;
        document.getElementById('stat-orders-sub').textContent = `${stats.statusBreakdown?.Processing || 0} processing`;
        document.getElementById('stat-products').textContent = stats.totalProducts || 0;
        document.getElementById('stat-users').textContent = stats.totalUsers || 0;
        document.getElementById('products-badge').textContent = stats.totalProducts || 0;
        document.getElementById('orders-badge').textContent = stats.statusBreakdown?.Processing || 0;

        // Status bars
        const total = stats.totalOrders || 1;
        const sb = stats.statusBreakdown || {};
        const bars = [
            { label: 'Processing', value: sb.Processing || 0, color: '#f59e0b' },
            { label: 'Shipped', value: sb.Shipped || 0, color: '#3b82f6' },
            { label: 'Delivered', value: sb.Delivered || 0, color: '#10b981' },
            { label: 'Cancelled', value: sb.Cancelled || 0, color: '#ef4444' }
        ];
        document.getElementById('status-bars').innerHTML = bars.map(b => `
            <div class="status-bar-row">
                <div class="status-bar-info">
                    <span>${b.label}</span>
                    <span>${b.value} / ${total}</span>
                </div>
                <div class="status-bar-track">
                    <div class="status-bar-fill" style="width:${Math.round((b.value / total) * 100)}%;background:${b.color}"></div>
                </div>
            </div>
        `).join('');

        // Low stock
        if (stats.lowStock?.length) {
            document.getElementById('low-stock-list').innerHTML = stats.lowStock.map(p => `
                <div class="low-stock-item">
                    <div>
                        <div class="ls-name">${p.name}</div>
                        <div class="ls-cat">${p.category}</div>
                    </div>
                    <div class="ls-stock">
                        <span class="stock-badge ${p.countInStock === 0 ? 'critical' : 'low'}">
                            ${p.countInStock === 0 ? 'Out of Stock' : p.countInStock + ' left'}
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            document.getElementById('low-stock-list').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.84rem"><i class="fas fa-check-circle" style="color:var(--success);margin-right:7px"></i>All products are sufficiently stocked</div>';
        }

        // Recent orders
        const orders = await adminAPI('/api/admin/orders');
        const recent = orders.slice(0, 8);
        document.getElementById('recent-orders-body').innerHTML = recent.length ? recent.map(o => `
            <tr>
                <td><code style="font-size:0.72rem;background:var(--surface-2);padding:2px 7px;border-radius:5px">#${o._id.slice(-8).toUpperCase()}</code></td>
                <td>${o.user?.name || 'Guest'}</td>
                <td>${o.orderItems?.length || 0} items</td>
                <td style="font-weight:700;color:var(--primary)">$${(o.totalPrice || 0).toFixed(2)}</td>
                <td><span class="status-pill sp-${o.status.toLowerCase()}">${o.status}</span></td>
                <td style="color:var(--text-muted)">${fmtDate(o.createdAt)}</td>
            </tr>
        `).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No orders yet</td></tr>';

    } catch (err) {
        adminToast('Failed to load dashboard: ' + err.message, 'error');
    }
}

// ─── PRODUCTS ────────────────────────────────────────
async function loadProducts() {
    try {
        document.getElementById('products-table-body').innerHTML = '<tr><td colspan="7" class="table-loading"><div class="mini-spinner"></div></td></tr>';
        const cats = await adminAPI('/api/categories');
        allCategories = cats;
        populateCategoryFilters();

        allProducts = await adminAPI('/api/admin/products');
        document.getElementById('products-badge').textContent = allProducts.length;
        renderProductsTable(allProducts);
    } catch (err) {
        adminToast('Failed to load products: ' + err.message, 'error');
    }
}

function renderProductsTable(products) {
    document.getElementById('product-count').textContent = products.length + ' products';
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = products.length ? products.map(p => {
        const stockClass = p.countInStock === 0 ? 'critical' : p.countInStock <= 5 ? 'low' : 'ok';
        return `
            <tr>
                <td>
                    <div class="product-row-info">
                        <div class="product-row-thumb"><img src="${p.image}" onerror="this.src='https://via.placeholder.com/40x40'" alt="${p.name}"></div>
                        <div>
                            <div class="product-row-name">${p.name}</div>
                            <div class="product-row-id">${p.productId || ''}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size:0.76rem;color:var(--text-muted)">${p.productId || '-'}</td>
                <td><span class="cat-chip">${p.category}</span></td>
                <td style="font-weight:700">$${p.price.toFixed(2)}</td>
                <td><span class="stock-num ${stockClass}">${p.countInStock}</span></td>
                <td>${p.rating.toFixed(1)} ⭐</td>
                <td>
                    <div class="action-btns">
                        <button class="admin-btn admin-btn-sm admin-btn-outline" onclick="openProductModal('${p._id}')"><i class="fas fa-edit"></i></button>
                        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="openDeleteModal('product','${p._id}','${p.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No products found</td></tr>';
}

function filterProducts(search) {
    const catFilter = document.getElementById('product-cat-filter').value;
    let filtered = allProducts;
    if (catFilter) filtered = filtered.filter(p => p.category === catFilter);
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.productId || '').toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    renderProductsTable(filtered);
}

function populateCategoryFilters() {
    const opts = allCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    document.getElementById('product-cat-filter').innerHTML = '<option value="">All Categories</option>' + opts;
    // Product modal category select
    const pmCat = document.getElementById('pm-category');
    if (pmCat) pmCat.innerHTML = '<option value="">Select category...</option>' + opts;
}

// Product Modal
function openProductModal(productId = null) {
    editingProductId = productId;
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    // Clear form
    ['pm-name', 'pm-price', 'pm-stock', 'pm-rating', 'pm-reviews', 'pm-image', 'pm-description'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('pm-category').value = '';
    document.getElementById('pm-error').classList.add('hidden');

    if (productId) {
        title.textContent = 'Edit Product';
        const p = allProducts.find(x => x._id === productId);
        if (p) {
            document.getElementById('pm-name').value = p.name;
            document.getElementById('pm-category').value = p.category;
            document.getElementById('pm-price').value = p.price;
            document.getElementById('pm-stock').value = p.countInStock;
            document.getElementById('pm-rating').value = p.rating;
            document.getElementById('pm-reviews').value = p.numReviews;
            document.getElementById('pm-image').value = p.image;
            document.getElementById('pm-description').value = p.description;
        }
    } else {
        title.textContent = 'Add New Product';
    }
    modal.classList.remove('hidden');
}

async function submitProduct() {
    const btn = document.getElementById('pm-submit');
    const errorEl = document.getElementById('pm-error');
    errorEl.classList.add('hidden');

    const data = {
        name: document.getElementById('pm-name').value.trim(),
        description: document.getElementById('pm-description').value.trim(),
        price: document.getElementById('pm-price').value,
        image: document.getElementById('pm-image').value.trim(),
        category: document.getElementById('pm-category').value,
        countInStock: document.getElementById('pm-stock').value || 0,
        rating: document.getElementById('pm-rating').value || 0,
        numReviews: document.getElementById('pm-reviews').value || 0
    };

    if (!data.name || !data.description || !data.price || !data.category) {
        showError(errorEl, 'Please fill in all required fields (name, description, price, category)');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="mini-spinner" style="width:15px;height:15px;margin-right:6px;display:inline-block"></div> Saving...';

    try {
        if (editingProductId) {
            await adminAPI(`/api/admin/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify(data) });
            adminToast('Product updated successfully!', 'success');
        } else {
            await adminAPI('/api/admin/products', { method: 'POST', body: JSON.stringify(data) });
            adminToast('Product added successfully!', 'success');
        }
        closeModal('product-modal');
        loadProducts();
    } catch (err) {
        showError(errorEl, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Product';
    }
}

// ─── CATEGORIES ───────────────────────────────────────
async function loadCategories() {
    const grid = document.getElementById('categories-admin-grid');
    grid.innerHTML = '<div class="loading-box"><div class="mini-spinner"></div><p>Loading...</p></div>';
    try {
        allCategories = await adminAPI('/api/categories');
        renderCategoriesGrid(allCategories);
    } catch (err) {
        adminToast('Failed to load categories: ' + err.message, 'error');
    }
}

function renderCategoriesGrid(cats) {
    const grid = document.getElementById('categories-admin-grid');
    grid.innerHTML = cats.length ? cats.map(c => `
        <div class="cat-admin-card">
            <div class="cat-admin-actions">
                <button class="admin-btn admin-btn-sm admin-btn-outline" onclick="openCategoryModal('${c._id}')"><i class="fas fa-edit"></i></button>
                <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="openDeleteModal('category','${c._id}','${c.name}')"><i class="fas fa-trash"></i></button>
            </div>
            <div class="cat-admin-icon" style="background:${c.color}22;color:${c.color}">
                <i class="fas ${c.icon || 'fa-tag'}"></i>
            </div>
            <div class="cat-admin-name">${c.name}</div>
            <div class="cat-admin-desc">${c.description || 'No description'}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
                <div style="width:12px;height:12px;border-radius:50%;background:${c.color}"></div>
                <span style="font-size:0.72rem;color:var(--text-muted)">${c.color}</span>
                <span style="font-size:0.72rem;color:var(--text-muted);margin-left:8px"><i class="fas ${c.icon || 'fa-tag'}"></i> ${c.icon || 'fa-tag'}</span>
            </div>
        </div>
    `).join('') : '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px">No categories found</p>';
}

function openCategoryModal(catId = null) {
    editingCategoryId = catId;
    document.getElementById('cm-name').value = '';
    document.getElementById('cm-description').value = '';
    document.getElementById('cm-icon').value = '';
    document.getElementById('cm-color').value = '#6366f1';
    document.getElementById('cm-color-picker').value = '#6366f1';
    document.getElementById('cm-error').classList.add('hidden');

    if (catId) {
        document.getElementById('category-modal-title').textContent = 'Edit Category';
        const cat = allCategories.find(c => c._id === catId);
        if (cat) {
            document.getElementById('cm-name').value = cat.name;
            document.getElementById('cm-description').value = cat.description || '';
            document.getElementById('cm-icon').value = cat.icon || '';
            document.getElementById('cm-color').value = cat.color || '#6366f1';
            document.getElementById('cm-color-picker').value = cat.color || '#6366f1';
        }
    } else {
        document.getElementById('category-modal-title').textContent = 'Add New Category';
    }
    document.getElementById('category-modal').classList.remove('hidden');
}

async function submitCategory() {
    const btn = document.getElementById('cm-submit');
    const errorEl = document.getElementById('cm-error');
    errorEl.classList.add('hidden');

    const data = {
        name: document.getElementById('cm-name').value.trim(),
        description: document.getElementById('cm-description').value.trim(),
        icon: document.getElementById('cm-icon').value.trim() || 'fa-tag',
        color: document.getElementById('cm-color').value
    };

    if (!data.name) { showError(errorEl, 'Category name is required'); return; }

    btn.disabled = true;
    try {
        if (editingCategoryId) {
            await adminAPI(`/api/admin/categories/${editingCategoryId}`, { method: 'PUT', body: JSON.stringify(data) });
            adminToast('Category updated!', 'success');
        } else {
            await adminAPI('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) });
            adminToast('Category added!', 'success');
        }
        closeModal('category-modal');
        loadCategories();
    } catch (err) {
        showError(errorEl, err.message);
    } finally {
        btn.disabled = false;
    }
}

// ─── ORDERS ──────────────────────────────────────────
async function loadOrders() {
    document.getElementById('orders-table-body').innerHTML = '<tr><td colspan="8" class="table-loading"><div class="mini-spinner"></div></td></tr>';
    try {
        allOrders = await adminAPI('/api/admin/orders');
        document.getElementById('orders-badge').textContent = allOrders.filter(o => o.status === 'Processing').length;
        renderOrdersTable(allOrders);
    } catch (err) {
        adminToast('Failed to load orders: ' + err.message, 'error');
    }
}

function filterOrders() {
    const search = document.getElementById('order-search').value.toLowerCase();
    const status = document.getElementById('order-status-filter').value;
    let filtered = allOrders;
    if (status) filtered = filtered.filter(o => o.status === status);
    if (search) filtered = filtered.filter(o => o._id.toLowerCase().includes(search) || (o.user?.name || '').toLowerCase().includes(search) || (o.user?.email || '').toLowerCase().includes(search));
    renderOrdersTable(filtered);
}

function renderOrdersTable(orders) {
    document.getElementById('order-count').textContent = orders.length + ' orders';
    document.getElementById('orders-table-body').innerHTML = orders.length ? orders.map(o => `
        <tr>
            <td><code style="font-size:0.72rem;background:var(--surface-2);padding:2px 7px;border-radius:5px">#${o._id.slice(-8).toUpperCase()}</code></td>
            <td>
                <div style="font-weight:600;font-size:0.84rem">${o.user?.name || 'Guest'}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${o.user?.email || ''}</div>
            </td>
            <td>${o.orderItems?.length || 0} items</td>
            <td style="font-weight:700;color:var(--primary)">$${(o.totalPrice || 0).toFixed(2)}</td>
            <td style="font-size:0.78rem;color:var(--text-2)">${o.paymentMethod || 'COD'}</td>
            <td>
                <select class="filter-select" style="font-size:0.72rem;padding:4px 8px;border-radius:7px" onchange="updateOrderStatus('${o._id}', this.value)">
                    ${['Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
            <td style="color:var(--text-muted);font-size:0.78rem">${fmtDate(o.createdAt)}</td>
            <td>
                <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="openDeleteModal('order','${o._id}','Order #${o._id.slice(-8).toUpperCase()}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted)">No orders found</td></tr>';
}

async function updateOrderStatus(orderId, status) {
    try {
        await adminAPI(`/api/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
        const order = allOrders.find(o => o._id === orderId);
        if (order) order.status = status;
        adminToast(`Order status updated to ${status}`, 'success');
    } catch (err) {
        adminToast(err.message, 'error');
        loadOrders();
    }
}

// ─── USERS ───────────────────────────────────────────
async function loadUsers() {
    document.getElementById('users-table-body').innerHTML = '<tr><td colspan="5" class="table-loading"><div class="mini-spinner"></div></td></tr>';
    try {
        allUsers = await adminAPI('/api/admin/users');
        renderUsersTable(allUsers);
    } catch (err) {
        adminToast('Failed to load users: ' + err.message, 'error');
    }
}

function filterUsers(search) {
    const q = search.toLowerCase();
    renderUsersTable(allUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
}

function renderUsersTable(users) {
    document.getElementById('user-count').textContent = users.length + ' users';
    document.getElementById('users-table-body').innerHTML = users.length ? users.map(u => `
        <tr>
            <td>
                <div class="td-user">
                    <div class="user-mini-avatar">${u.name.charAt(0).toUpperCase()}</div>
                    <div style="font-weight:600;font-size:0.84rem">${u.name}</div>
                </div>
            </td>
            <td style="color:var(--text-2);font-size:0.84rem">${u.email}</td>
            <td><span class="role-badge ${u.isAdmin ? 'rb-admin' : 'rb-user'}">${u.isAdmin ? 'Admin' : 'Customer'}</span></td>
            <td style="color:var(--text-muted);font-size:0.78rem">${fmtDate(u.createdAt)}</td>
            <td>
                <div class="action-btns">
                    ${!u.isAdmin ? `
                    <button class="admin-btn admin-btn-sm admin-btn-success" onclick="toggleUserAdmin('${u._id}', true)" title="Make Admin">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                    <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="openDeleteModal('user','${u._id}','${u.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-trash"></i>
                    </button>` : `<span style="font-size:0.72rem;color:var(--text-muted)">Protected</span>`}
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">No users found</td></tr>';
}

async function toggleUserAdmin(userId, isAdmin) {
    try {
        await adminAPI(`/api/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ isAdmin }) });
        adminToast('User updated!', 'success');
        loadUsers();
    } catch (err) {
        adminToast(err.message, 'error');
    }
}

// ─── DELETE ───────────────────────────────────────────
function openDeleteModal(type, id, name) {
    deleteAction = { type, id };
    document.getElementById('delete-msg').textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
    document.getElementById('delete-modal').classList.remove('hidden');
}

async function confirmDelete() {
    if (!deleteAction) return;
    const btn = document.getElementById('delete-confirm-btn');
    btn.disabled = true;
    try {
        const { type, id } = deleteAction;
        let url = '';
        if (type === 'product') url = `/api/admin/products/${id}`;
        if (type === 'category') url = `/api/admin/categories/${id}`;
        if (type === 'order') url = `/api/admin/orders/${id}`;
        if (type === 'user') url = `/api/admin/users/${id}`;
        await adminAPI(url, { method: 'DELETE' });
        adminToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');
        closeModal('delete-modal');

        if (type === 'product') loadProducts();
        if (type === 'category') loadCategories();
        if (type === 'order') loadOrders();
        if (type === 'user') loadUsers();
    } catch (err) {
        adminToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        deleteAction = null;
    }
}

// ─── SEARCH (topbar) ─────────────────────────────────
function handleAdminSearch(q) {
    const activePage = document.querySelector('.admin-page.active');
    if (!activePage) return;
    const pageId = activePage.id.replace('page-', '');
    if (pageId === 'products') { document.getElementById('product-search').value = q; filterProducts(q); }
    if (pageId === 'orders') { document.getElementById('order-search').value = q; filterOrders(); }
    if (pageId === 'users') { document.getElementById('user-search').value = q; filterUsers(q); }
}

// ─── MODALS ───────────────────────────────────────────
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
});

// ─── UTILS ───────────────────────────────────────────
function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showError(el, msg) {
    el.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    el.classList.remove('hidden');
}

function adminToast(msg, type = 'info') {
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    const container = document.getElementById('admin-toasts');
    const t = document.createElement('div');
    t.className = `a-toast ${type}`;
    t.innerHTML = `<i class="fas ${icons[type]}"></i><span class="a-toast-msg">${msg}</span><i class="fas fa-times a-toast-close" onclick="this.parentElement.remove()"></i>`;
    container.appendChild(t);
    setTimeout(() => { if (t.parentElement) t.remove(); }, 3500);
}

function toggleAdminPass(btn) {
    const input = document.getElementById('admin-password');
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = `<i class="fas ${isPass ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
}

// Enter key on login fields
document.getElementById('admin-password').addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
document.getElementById('admin-email').addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });

// Keyboard close modals
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
});
