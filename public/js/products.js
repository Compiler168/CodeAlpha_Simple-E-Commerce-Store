/* =========================================================
   ShopVerse — Product Listing, Detail & Categories Logic
   ========================================================= */

let allProducts = [];
let detailQty = 1;

// ---- Load Products ----
async function loadProducts(category = null, search = null) {
  const grid = document.getElementById('products-grid');
  const loader = document.getElementById('products-loader');
  const noMsg = document.getElementById('no-products-msg');

  if (!grid) return;

  loader.classList.remove('hidden');
  grid.innerHTML = '';
  if (noMsg) noMsg.classList.add('hidden');

  try {
    let url = '/api/products';
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    if (params.toString()) url += '?' + params.toString();

    const products = await apiRequest(url);
    allProducts = products;
    loader.classList.add('hidden');

    if (products.length === 0) {
      if (noMsg) noMsg.classList.remove('hidden');
      return;
    }

    grid.innerHTML = products.map((product, index) => `
            <div class="product-card" 
                data-price="${product.price}" 
                data-rating="${product.rating}" 
                data-date="${product.createdAt}"
                onclick="navigateTo('product-detail', '${product._id}')" 
                style="animation-delay: ${index * 0.04}s">
                <div class="product-card-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy"
                        onerror="this.src='https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}'">
                    ${product.countInStock <= 5 && product.countInStock > 0 ? '<span class="product-card-badge">Low Stock</span>' : ''}
                    ${product.countInStock === 0 ? '<span class="product-card-badge" style="background:var(--danger)">Sold Out</span>' : ''}
                    <button class="product-card-quick" onclick="event.stopPropagation(); addToCartQuick('${product._id}')" title="Quick Add">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
                <div class="product-card-info">
                    <div class="product-card-meta">
                        <span class="product-card-category">${product.category}</span>
                        <span class="product-card-id">${product.productId || ''}</span>
                    </div>
                    <h3 class="product-card-name">${product.name}</h3>
                    <p class="product-card-desc">${product.description}</p>
                    <div class="product-card-rating">
                        <div class="stars">${renderStars(product.rating)}</div>
                        <span class="rating-count">(${product.numReviews})</span>
                    </div>
                    <div class="product-card-bottom">
                        <span class="product-card-price">$${product.price.toFixed(2)}</span>
                        <button class="product-card-cart-btn" 
                            onclick="event.stopPropagation(); addToCartQuick('${product._id}')"
                            ${product.countInStock === 0 ? 'disabled' : ''} title="Add to Cart">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

  } catch (error) {
    loader.classList.add('hidden');
    grid.innerHTML = `
            <div class="no-products" style="grid-column:1/-1">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load products</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadProducts()" style="margin-top:16px">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
  }
}

// ---- Quick Add to Cart ----
function addToCartQuick(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (product) {
    if (product.countInStock === 0) { showToast('Product is out of stock', 'error'); return; }
    addToCart(product, 1);
  }
}

// ---- Load Categories Page ----
async function loadCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Loading categories...</p></div>`;

  try {
    const categories = await apiRequest('/api/categories');
    const products = await apiRequest('/api/products');

    const catCounts = {};
    products.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });

    if (!categories.length) {
      grid.innerHTML = `<p style="color:var(--text-muted)">No categories found.</p>`;
      return;
    }

    grid.innerHTML = categories.map(cat => `
            <div class="category-card" style="--cat-color:${cat.color || 'var(--primary)'}" 
                onclick="filterByCategory('${cat.name}', null); navigateTo('home')">
                <div class="category-card-icon">
                    <i class="fas ${cat.icon || 'fa-tag'}"></i>
                </div>
                <div class="category-card-name">${cat.name}</div>
                <div class="category-card-desc">${cat.description || ''}</div>
                <div class="category-card-count"><i class="fas fa-box"></i> ${catCounts[cat.name] || 0} Products</div>
                <i class="fas fa-arrow-right category-card-arrow"></i>
            </div>
        `).join('');

  } catch (error) {
    grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load categories</h3>
                <p>${error.message}</p>
            </div>
        `;
  }
}

// ---- Load Product Detail ----
async function loadProductDetail(productId) {
  const content = document.getElementById('product-detail-content');
  content.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Loading product...</p></div>`;

  try {
    const product = await apiRequest(`/api/products/${productId}`);
    detailQty = 1;

    content.innerHTML = `
            <button class="btn-back" onclick="navigateTo('home')" style="margin-bottom:24px">
                <i class="fas fa-arrow-left"></i>
            </button>
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy"
                        onerror="this.src='https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}'">
                </div>
                <div class="product-detail-info">
                    <div class="product-detail-id"><i class="fas fa-barcode"></i> ID: ${product.productId || product._id.slice(-8).toUpperCase()}</div>
                    <span class="product-detail-category">${product.category}</span>
                    <h1 class="product-detail-name">${product.name}</h1>
                    <div class="product-detail-rating">
                        <div class="stars">${renderStars(product.rating)}</div>
                        <span>${product.rating.toFixed(1)} / 5</span>
                        <span style="color:var(--text-muted)">(${product.numReviews} reviews)</span>
                    </div>
                    <div class="product-detail-price">$${product.price.toFixed(2)}</div>
                    <p class="product-detail-description">${product.description}</p>
                    <div class="product-detail-meta">
                        <div class="meta-row">
                            <span class="meta-label">Availability</span>
                            <span class="meta-value ${product.countInStock > 0 ? 'in-stock' : 'out-of-stock'}">
                                ${product.countInStock > 0 ? `<i class="fas fa-check-circle"></i> In Stock (${product.countInStock} available)` : '<i class="fas fa-times-circle"></i> Out of Stock'}
                            </span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Category</span>
                            <span class="meta-value">${product.category}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Product ID</span>
                            <span class="meta-value">${product.productId || 'N/A'}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Shipping</span>
                            <span class="meta-value" style="color:var(--success)">
                                ${product.price >= 100 ? '<i class="fas fa-shipping-fast"></i> Free Shipping' : '$10.00 Shipping (Free over $100)'}
                            </span>
                        </div>
                    </div>
                    ${product.countInStock > 0 ? `
                        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
                            <span style="font-size:0.9rem;color:var(--text-secondary);font-weight:500">Quantity:</span>
                            <div class="quantity-selector">
                                <button class="qty-btn" onclick="updateDetailQty(-1,${product.countInStock})">−</button>
                                <span class="qty-value" id="detail-qty">1</span>
                                <button class="qty-btn" onclick="updateDetailQty(1,${product.countInStock})">+</button>
                            </div>
                        </div>
                        <div class="product-detail-actions">
                            <button class="btn btn-primary btn-lg glow-btn" onclick="addProductToCart('${product._id}')" style="flex:1">
                                <i class="fas fa-shopping-bag"></i> Add to Cart
                            </button>
                            <button class="btn btn-glass btn-lg" onclick="buyNow('${product._id}')">
                                <i class="fas fa-bolt"></i> Buy Now
                            </button>
                        </div>
                    ` : `
                        <div class="product-detail-actions">
                            <button class="btn btn-primary btn-lg" disabled style="flex:1;opacity:0.5">
                                <i class="fas fa-times"></i> Out of Stock
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;

    // Store product in cache for cart use
    if (!allProducts.find(p => p._id === product._id)) allProducts.push(product);

  } catch (error) {
    content.innerHTML = `
            <div class="no-products" style="padding:80px 20px">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Product not found</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="navigateTo('home')" style="margin-top:16px">
                    <i class="fas fa-arrow-left"></i> Back to Shop
                </button>
            </div>
        `;
  }
}

function updateDetailQty(change, maxStock) {
  detailQty = Math.max(1, Math.min(maxStock, detailQty + change));
  document.getElementById('detail-qty').textContent = detailQty;
}

function addProductToCart(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (product) { addToCart(product, detailQty); detailQty = 1; }
}

function buyNow(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (product) { addToCart(product, detailQty); detailQty = 1; navigateTo('cart'); }
}
