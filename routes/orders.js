const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items provided' });
        }

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address ||
            !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
            return res.status(400).json({ message: 'Please provide complete shipping address' });
        }

        // Calculate prices
        const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const shippingPrice = subtotal > 100 ? 0 : 10;
        const totalPrice = subtotal + shippingPrice;

        // Update stock for each product
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.countInStock = Math.max(0, product.countInStock - item.quantity);
                await product.save();
            }
        }

        const order = await Order.create({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            subtotal,
            shippingPrice,
            totalPrice
        });

        // --- SEND EMAIL NOTIFICATION TO ADMIN ---
        try {
            // Build the items list for the email
            let itemsHtml = orderItems.map(item => `
                <li>
                    <strong>${item.name}</strong><br>
                    Quantity: ${item.quantity}<br>
                    Price: $${item.price}
                </li>
            `).join('');

            const emailHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #FF6B00;">🎉 New Order Received!</h2>
                    <p>A new customer has just purchased items from ShopVerse.</p>
                    
                    <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Buyer Information</h3>
                    <p>
                        <strong>Name:</strong> ${shippingAddress.fullName} <br>
                        <strong>Address:</strong> ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.postalCode}, ${shippingAddress.country} <br>
                        <strong>User ID:</strong> ${req.user._id} <br>
                        <strong>Email:</strong> ${req.user.email} (if populated, else check admin panel)
                    </p>

                    <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Order Details (ID: ${order._id})</h3>
                    <ul>
                        ${itemsHtml}
                    </ul>
                    
                    <p style="font-size: 1.1em;"><strong>Total Paid (${order.paymentMethod}):</strong> <span style="color: #1a5ce4;">$${order.totalPrice.toFixed(2)}</span></p>
                    
                    <br>
                    <p style="font-size: 0.9em; color: #777;">You can log in to the <a href="http://localhost:5000/admin">ShopVerse Admin Dashboard</a> to view and manage this order.</p>
                </div>
            `;

            // Note: The user provided a typo 'gmil.com'. Defaulting here to 'gmail.com'.
            await sendEmail({
                email: 'majidzaffar35@gmail.com',
                subject: `New Order Alert! - Order #${order._id.toString().slice(-8).toUpperCase()} - $${order.totalPrice.toFixed(2)}`,
                html: emailHtml
            });
        } catch (emailError) {
            console.error('Failed to send order notification email:', emailError);
        }
        // -----------------------------------------

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/orders/my
// @desc    Get logged-in user's orders
// @access  Private
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (order) {
            // Check if user owns the order or is admin
            if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
                return res.status(403).json({ message: 'Not authorized to view this order' });
            }
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
