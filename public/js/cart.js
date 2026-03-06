/* =========================================================
   ShopVerse — Cart Logic
   ========================================================= */

let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// ---- Update Badge ----
function updateCartBadge() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = total;
}

// ---- Add to Cart ----
function addToCart(product, qty = 1) {
  const existing = cart.find(item => item._id === product._id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, product.countInStock);
  } else {
    cart.push({ ...product, quantity: qty });
  }
  saveCart();
  showToast(`<strong>${product.name}</strong> added to cart!`, 'success');
  animateCartBadge();
}

function animateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  badge.style.transform = 'scale(1.5)';
  setTimeout(() => badge.style.transform = '', 300);
}

// ---- Remove from Cart ----
function removeFromCart(productId) {
  cart = cart.filter(item => item._id !== productId);
  saveCart();
  renderCart();
}

// ---- Update Quantity ----
function updateCartQty(productId, newQty) {
  const item = cart.find(i => i._id === productId);
  if (!item) return;
  const qty = parseInt(newQty);
  if (qty < 1) { removeFromCart(productId); return; }
  item.quantity = Math.min(qty, item.countInStock);
  saveCart();
  renderCart();
}

// ---- Save ----
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

// ---- Render Cart ----
function renderCart() {
  const itemsContainer = document.getElementById('cart-items');
  const summaryContainer = document.getElementById('cart-summary');
  const countTitle = document.getElementById('cart-count-title');
  if (!itemsContainer) return;

  if (countTitle) countTitle.textContent = cart.length ? `(${cart.reduce((s, i) => s + i.quantity, 0)} items)` : '';

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-bag"></i>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <button class="btn btn-primary btn-lg" onclick="navigateTo('home')">
                    <i class="fas fa-shopping-bag"></i> Start Shopping
                </button>
            </div>
        `;
    if (summaryContainer) summaryContainer.innerHTML = '';
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 100 ? 0 : 10;
  const total = subtotal + shipping;

  itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}"
                    onerror="this.src='https://via.placeholder.com/90x90?text=Item'">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-category">${item.category}</div>
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-item-controls">
                    <div class="quantity-selector">
                        <button class="qty-btn" onclick="updateCartQty('${item._id}', ${item.quantity - 1})">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQty('${item._id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item._id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');

  if (summaryContainer) {
    summaryContainer.innerHTML = `
            <div class="cart-summary-card">
                <h3>Order Summary</h3>
                <div class="summary-row">
                    <span>Subtotal (${cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row ${shipping === 0 ? 'free-shipping' : ''}">
                    <span>Shipping</span>
                    <span>${shipping === 0 ? '<i class="fas fa-shipping-fast"></i> FREE' : '$' + shipping.toFixed(2)}</span>
                </div>
                ${subtotal < 100 ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px">Add $${(100 - subtotal).toFixed(2)} more for free shipping</div>` : ''}
                <div class="summary-row total">
                    <span>Total</span>
                    <strong>$${total.toFixed(2)}</strong>
                </div>
                <button class="btn btn-primary btn-lg btn-full glow-btn" onclick="proceedToCheckout()" style="margin-top:16px">
                    <i class="fas fa-lock"></i> Proceed to Checkout
                </button>
                <button class="btn btn-glass btn-full" onclick="navigateTo('home')" style="margin-top:10px">
                    <i class="fas fa-arrow-left"></i> Continue Shopping
                </button>
            </div>
        `;
  }
}

// ---- Checkout ----
function proceedToCheckout() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    showToast('Please login to checkout', 'warning');
    navigateTo('login');
    return;
  }
  navigateTo('checkout');
}

// ---- Render Checkout Summary ----
function renderCheckout() {
  const summaryEl = document.getElementById('checkout-summary');
  if (!summaryEl || !cart.length) return;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 100 ? 0 : 10;
  const total = subtotal + shipping;

  summaryEl.innerHTML = `
        <div class="checkout-summary-card">
            <h3>Order Summary</h3>
            ${cart.map(item => `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                    <div style="width:50px;height:50px;border-radius:10px;overflow:hidden;flex-shrink:0;border:1px solid var(--border)">
                        <img src="${item.image}" style="width:100%;height:100%;object-fit:cover"
                            onerror="this.src='https://via.placeholder.com/50x50'">
                    </div>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:0.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">Qty: ${item.quantity}</div>
                    </div>
                    <div style="font-weight:700;font-size:0.9rem;flex-shrink:0">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `).join('')}
            <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:4px">
                <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
                <div class="summary-row ${shipping === 0 ? 'free-shipping' : ''}">
                    <span>Shipping</span><span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
                </div>
                <div class="summary-row total"><span>Total</span><strong>$${total.toFixed(2)}</strong></div>
            </div>
        </div>
    `;
}

// ---- Handle Checkout Submit ----
async function handleCheckout(e) {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) { showToast('Please login first', 'warning'); navigateTo('login'); return; }
  if (!cart.length) { showToast('Your cart is empty', 'error'); navigateTo('cart'); return; }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;margin:auto"></div>';

  const shippingAddress = {
    fullName: document.getElementById('ship-fullname').value,
    address: document.getElementById('ship-address').value,
    city: document.getElementById('ship-city').value,
    postalCode: document.getElementById('ship-postal').value,
    country: document.getElementById('ship-country').value,
  };
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'Cash on Delivery';
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingPrice = subtotal >= 100 ? 0 : 10;
  const totalPrice = subtotal + shippingPrice;

  try {
    const order = await apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        orderItems: cart.map(item => ({
          product: item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity
        })),
        shippingAddress,
        paymentMethod,
        itemsPrice: subtotal,
        shippingPrice,
        totalPrice
      })
    });

    cart = [];
    saveCart();
    showConfirmation(order);
  } catch (error) {
    showToast(error.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-lock"></i> Place Order Securely';
  }
}

function showConfirmation(order) {
  navigateTo('order-confirmation');
  const content = document.getElementById('confirmation-content');
  if (!content) return;
  content.innerHTML = `
        <div class="confirm-icon"><i class="fas fa-check"></i></div>
        <h1>Order Confirmed! 🎉</h1>
        <p style="font-size:1.1rem;margin-bottom:20px">Thank you for your purchase!</p>
        <p style="color:var(--text-muted)">Order ID: <strong>${order._id}</strong></p>
        <p style="color:var(--text-muted);margin-bottom:32px">Total: <strong>$${order.totalPrice?.toFixed(2)}</strong></p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary btn-lg glow-btn" onclick="navigateTo('orders')">
                <i class="fas fa-box"></i> View My Orders
            </button>
            <button class="btn btn-glass btn-lg" onclick="navigateTo('home')">
                <i class="fas fa-shopping-bag"></i> Continue Shopping
            </button>
        </div>
    `;
}

// ---- Init ----
updateCartBadge();
