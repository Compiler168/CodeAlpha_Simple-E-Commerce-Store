/* =========================================================
   ShopVerse — Orders Logic
   ========================================================= */

async function loadOrders() {
  const list = document.getElementById('orders-list');
  if (!list) return;

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    list.innerHTML = `
            <div class="no-products">
                <i class="fas fa-lock"></i>
                <h3>Login Required</h3>
                <p>Please login to view your orders.</p>
                <button class="btn btn-primary" onclick="navigateTo('login')" style="margin-top:16px">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
            </div>
        `;
    return;
  }

  list.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Loading orders...</p></div>`;

  try {
    const orders = await apiRequest('/api/orders/my');

    if (!orders.length) {
      list.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>No orders yet</h3>
                    <p>You haven't placed any orders. Start shopping!</p>
                    <button class="btn btn-primary btn-lg glow-btn" onclick="navigateTo('home')" style="margin-top:16px">
                        <i class="fas fa-shopping-bag"></i> Start Shopping
                    </button>
                </div>
            `;
      return;
    }

    const statusClass = { Processing: 'status-processing', Delivered: 'status-delivered', Cancelled: 'status-cancelled' };

    list.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div style="font-weight:700;margin-bottom:4px">Order #${order._id.slice(-8).toUpperCase()}</div>
                        <div class="order-date">${formatDate(order.createdAt)}</div>
                    </div>
                    <div style="text-align:right">
                        <span class="order-status ${statusClass[order.status] || 'status-processing'}">${order.status}</span>
                        <div class="order-total" style="margin-top:6px">$${order.totalPrice.toFixed(2)}</div>
                    </div>
                </div>
                <div class="order-items-preview">
                    ${order.orderItems.map(item => `
                        <div class="order-item-thumb" title="${item.name} × ${item.quantity}">
                            <img src="${item.image}" alt="${item.name}" loading="lazy"
                                onerror="this.src='https://via.placeholder.com/56x56?text=Item'">
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <span style="font-size:0.85rem;color:var(--text-muted)">
                        ${order.orderItems.length} item${order.orderItems.length > 1 ? 's' : ''} · 
                        ${order.paymentMethod || 'Cash on Delivery'}
                    </span>
                    <span style="font-size:0.82rem;color:${order.shippingPrice === 0 ? 'var(--success)' : 'var(--text-muted)'}">
                        ${order.shippingPrice === 0 ? '✓ Free Shipping' : `Shipping: $${order.shippingPrice}`}
                    </span>
                </div>
            </div>
        `).join('');

  } catch (error) {
    list.innerHTML = `
            <div class="no-products">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load orders</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadOrders()" style="margin-top:16px">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
