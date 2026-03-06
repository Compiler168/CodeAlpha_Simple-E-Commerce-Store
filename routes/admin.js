const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');

// All admin routes require auth + admin role
router.use(protect, admin);

// ─── DASHBOARD STATS ───────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalProducts, totalOrders, categories, orders] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Category.find(),
            Order.find().select('totalPrice status createdAt')
        ]);

        const totalRevenue = orders
            .filter(o => o.status !== 'Cancelled')
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        const statusBreakdown = { Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
        orders.forEach(o => { if (statusBreakdown[o.status] !== undefined) statusBreakdown[o.status]++; });

        // Revenue last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRevenue = orders
            .filter(o => new Date(o.createdAt) >= sevenDaysAgo && o.status !== 'Cancelled')
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        // Low stock products
        const lowStock = await Product.find({ countInStock: { $lte: 5 } }).select('name countInStock category').limit(5);

        res.json({
            totalUsers, totalProducts, totalOrders,
            totalCategories: categories.length,
            totalRevenue, recentRevenue,
            statusBreakdown, lowStock,
            categories
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── USER MANAGEMENT ──────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (req.body.isAdmin !== undefined) user.isAdmin = req.body.isAdmin;
        if (req.body.name) user.name = req.body.name;
        await user.save();
        res.json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete admin user' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── ORDER MANAGEMENT ─────────────────────────────────────
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('user', 'name email');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── PRODUCT MANAGEMENT (admin versions with no auth re-check) ─
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/products', async (req, res) => {
    try {
        const { name, description, price, image, category, countInStock, rating, numReviews } = req.body;
        if (!name || !description || !price || !category) {
            return res.status(400).json({ message: 'Please provide name, description, price, and category' });
        }
        const count = await Product.countDocuments();
        const product = await Product.create({
            productId: `PRD-${String(count + 1).padStart(4, '0')}`,
            name, description,
            price: parseFloat(price),
            image: image || `https://via.placeholder.com/400x400?text=${encodeURIComponent(name)}`,
            category, countInStock: parseInt(countInStock) || 0,
            rating: parseFloat(rating) || 0, numReviews: parseInt(numReviews) || 0
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        const fields = ['name', 'description', 'price', 'image', 'category', 'countInStock', 'rating', 'numReviews'];
        fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
        const updated = await product.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── CATEGORY MANAGEMENT ──────────────────────────────────
router.post('/categories', async (req, res) => {
    try {
        const { name, description, icon, color } = req.body;
        if (!name) return res.status(400).json({ message: 'Category name required' });
        const cat = await Category.create({ name, description, icon: icon || 'fa-tag', color: color || '#6366f1' });
        res.status(201).json(cat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cat) return res.status(404).json({ message: 'Category not found' });
        res.json(cat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const cat = await Category.findByIdAndDelete(req.params.id);
        if (!cat) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
