const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');

const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

// Admin dashboard - serve admin/index.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Frontend catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// ---- Auto-Seed ----
async function autoSeed() {
    try {
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.log('📦 Auto-seeding database...');
            const salt = await bcrypt.genSalt(10);

            await User.findOneAndUpdate({ email: 'admin@shopverse.com' }, {
                name: 'Admin User', email: 'admin@shopverse.com',
                password: await bcrypt.hash('admin123', salt), isAdmin: true
            }, { upsert: true, new: true });

            await User.findOneAndUpdate({ email: 'john@example.com' }, {
                name: 'John Doe', email: 'john@example.com',
                password: await bcrypt.hash('user123', salt), isAdmin: false
            }, { upsert: true, new: true });

            const categoriesData = [
                { name: 'Electronics', description: 'Latest gadgets, devices, and tech accessories', icon: 'fa-microchip', color: '#6366f1' },
                { name: 'Audio', description: 'Headphones, speakers, and premium sound equipment', icon: 'fa-headphones', color: '#8b5cf6' },
                { name: 'Fashion', description: 'Trendy clothing, bags, and style essentials', icon: 'fa-tshirt', color: '#ec4899' },
                { name: 'Accessories', description: 'Watches, sunglasses, and premium accessories', icon: 'fa-glasses', color: '#f59e0b' },
                { name: 'Sports', description: 'Athletic gear, equipment, and sportswear', icon: 'fa-running', color: '#10b981' },
                { name: 'Photography', description: 'Cameras, lenses, and photography equipment', icon: 'fa-camera', color: '#3b82f6' }
            ];
            for (const cat of categoriesData) {
                await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true, new: true });
            }

            const products = [
                { productId: 'PRD-0001', name: 'Nexus FitPro Smartwatch', description: 'Advanced fitness smartwatch with AMOLED display, GPS tracking, heart rate monitor, SpO2 sensor, and sleep analysis. Water-resistant to 50m with 14-day battery life.', price: 249.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', category: 'Electronics', countInStock: 18, rating: 4.5, numReviews: 95 },
                { productId: 'PRD-0002', name: 'MechStrike RGB Gaming Keyboard', description: 'Compact 75% mechanical gaming keyboard with hot-swappable switches, per-key RGB lighting, and programmable macros. Aluminum frame construction with PBT keycaps.', price: 109.99, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80', category: 'Electronics', countInStock: 35, rating: 4.6, numReviews: 89 },
                { productId: 'PRD-0003', name: 'UltraView 4K Monitor', description: '27-inch 4K IPS monitor with 144Hz refresh rate, HDR400 support, and G-Sync compatible. Features USB-C, HDMI 2.1, and DisplayPort 1.4.', price: 449.99, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80', category: 'Electronics', countInStock: 12, rating: 4.7, numReviews: 73 },
                { productId: 'PRD-0004', name: 'HyperX Pro Gaming Mouse', description: 'Professional gaming mouse with 25,600 DPI optical sensor, 8 programmable buttons. Lightweight 59g design with paracord cable.', price: 79.99, image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80', category: 'Electronics', countInStock: 40, rating: 4.4, numReviews: 112 },
                { productId: 'PRD-0005', name: 'ProSound Wireless Headphones', description: 'Premium over-ear wireless headphones with active noise cancellation, 40-hour battery life, and Hi-Res audio support. Bluetooth 5.3 with multipoint connection.', price: 149.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', category: 'Audio', countInStock: 25, rating: 4.7, numReviews: 128 },
                { productId: 'PRD-0006', name: 'BassVibe Portable Speaker', description: 'Rugged portable Bluetooth speaker with 360° surround sound, deep bass, and 24-hour playtime. IP67 waterproof and dustproof rated.', price: 69.99, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80', category: 'Audio', countInStock: 50, rating: 4.4, numReviews: 156 },
                { productId: 'PRD-0007', name: 'AirPods Elite Pro', description: 'True wireless earbuds with adaptive active noise cancellation, spatial audio, and 30-hour total battery life. Sweat and water resistant (IPX4).', price: 199.99, image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80', category: 'Audio', countInStock: 30, rating: 4.8, numReviews: 214 },
                { productId: 'PRD-0008', name: 'Urban Explorer Leather Backpack', description: 'Handcrafted genuine leather laptop backpack with padded 15.6" laptop compartment, multiple organization pockets, and anti-theft hidden back pocket.', price: 89.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80', category: 'Fashion', countInStock: 32, rating: 4.8, numReviews: 67 },
                { productId: 'PRD-0009', name: 'Premium Denim Jacket', description: 'Classic stonewashed denim jacket with modern slim fit. Features two chest pockets, two side slash pockets. Made from 100% premium cotton denim.', price: 74.99, image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=400&q=80', category: 'Fashion', countInStock: 28, rating: 4.3, numReviews: 45 },
                { productId: 'PRD-0010', name: 'Silk Blend Scarf Collection', description: 'Luxurious silk-blend scarf with hand-rolled edges. Lightweight and breathable, perfect for all seasons. Dimensions: 90cm x 90cm.', price: 49.99, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=80', category: 'Fashion', countInStock: 55, rating: 4.5, numReviews: 38 },
                { productId: 'PRD-0011', name: 'Luxe Aviator Sunglasses', description: 'Premium polarized aviator sunglasses with titanium frame, scratch-resistant CR-39 lenses, and UV400 protection. Includes handcrafted leather case.', price: 59.99, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80', category: 'Accessories', countInStock: 60, rating: 4.3, numReviews: 74 },
                { productId: 'PRD-0012', name: 'Minimalist Leather Wallet', description: 'Ultra-slim RFID-blocking leather wallet with 6 card slots. Crafted from full-grain vegetable-tanned leather. Fits comfortably in front pocket.', price: 39.99, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80', category: 'Accessories', countInStock: 80, rating: 4.6, numReviews: 124 },
                { productId: 'PRD-0013', name: 'Chronos Classic Watch', description: 'Elegant mechanical automatic watch with sapphire crystal glass, stainless steel case, and genuine leather strap. Water resistant to 50m.', price: 299.99, image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80', category: 'Accessories', countInStock: 4, rating: 4.9, numReviews: 53 },
                { productId: 'PRD-0014', name: 'Velocity Pro Running Shoes', description: 'Lightweight performance running shoes with responsive foam midsole, breathable mesh upper, and carbon fiber plate for energy return.', price: 129.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', category: 'Sports', countInStock: 45, rating: 4.6, numReviews: 203 },
                { productId: 'PRD-0015', name: 'PowerFlex Resistance Bands Set', description: 'Complete set of 5 resistance bands (10-50 lbs) with door anchor, ankle straps, carrying bag. Made from heavy-duty natural latex.', price: 34.99, image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&q=80', category: 'Sports', countInStock: 75, rating: 4.4, numReviews: 187 },
                { productId: 'PRD-0016', name: 'TrailBlazer Hydration Pack', description: '20L hydration backpack with 2L BPA-free water reservoir, 100 oz capacity. Multiple pockets for gear, reflective strips for safety.', price: 79.99, image: 'https://images.unsplash.com/photo-1622964994099-2426d4b42a1f?w=400&q=80', category: 'Sports', countInStock: 22, rating: 4.5, numReviews: 64 },
                { productId: 'PRD-0017', name: 'CaptureX Pro Mirrorless Camera', description: 'Professional 45MP full-frame mirrorless camera with 8K video recording, in-body image stabilization, and advanced AI autofocus. Dual card slots.', price: 1299.99, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80', category: 'Photography', countInStock: 8, rating: 4.9, numReviews: 42 },
                { productId: 'PRD-0018', name: 'Titan 85mm f/1.4 Portrait Lens', description: 'Premium portrait lens with ultra-wide f/1.4 aperture for stunning bokeh and low-light performance. Features advanced optical formula with ED glass elements.', price: 799.99, image: 'https://images.unsplash.com/photo-1606986628253-e0f20b4dc02e?w=400&q=80', category: 'Photography', countInStock: 5, rating: 4.8, numReviews: 29 },
                { productId: 'PRD-0019', name: 'ProStudio Carbon Tripod', description: 'Professional carbon fiber tripod rated for 22kg load. Features twist-lock leg sections, spiked/rubber feet, and center column inversion. Includes carrying bag.', price: 189.99, image: 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?w=400&q=80', category: 'Photography', countInStock: 11, rating: 4.7, numReviews: 38 }
            ];
            for (const p of products) {
                await Product.findOneAndUpdate({ productId: p.productId }, p, { upsert: true, new: true });
            }
            console.log('✅ Seeded 19 products, 6 categories, 2 users');
            console.log('   👤 Admin: admin@shopverse.com / admin123');
            console.log('   👤 User: john@example.com / user123');
        } else {
            console.log(`📦 ${productCount} products in DB — skipping seed.`);
        }
    } catch (error) {
        console.error('⚠️  Seed error:', error.message);
    }
}

const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await connectDB();
    await autoSeed();
    app.listen(PORT, () => {
        console.log(`\n🚀 Store:  http://localhost:${PORT}`);
        console.log(`🔧 Admin:  http://localhost:${PORT}/admin\n`);
    });
};

// If running locally, start the server normally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    startServer();
} else {
    // For Vercel Serverless environment, we just establish the DB connection
    // and let Vercel handle the actual HTTP request listening
    connectDB().catch(console.error);
}

// Export the Express app for Vercel
module.exports = app;
