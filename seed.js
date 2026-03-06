const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');

const connectDB = require('./config/db');

const products = [
    {
        name: 'ProSound Wireless Headphones',
        description: 'Premium over-ear wireless headphones with active noise cancellation, 40-hour battery life, and Hi-Res audio support. Features plush memory foam ear cushions and foldable design for portability. Bluetooth 5.3 with multipoint connection.',
        price: 149.99,
        image: '/images/headphones.png',
        category: 'Audio',
        countInStock: 25,
        rating: 4.7,
        numReviews: 128
    },
    {
        name: 'Nexus FitPro Smartwatch',
        description: 'Advanced fitness smartwatch with AMOLED display, GPS tracking, heart rate monitor, SpO2 sensor, and sleep analysis. Water-resistant to 50m with 14-day battery life. Compatible with iOS and Android.',
        price: 249.99,
        image: '/images/smartwatch.png',
        category: 'Electronics',
        countInStock: 18,
        rating: 4.5,
        numReviews: 95
    },
    {
        name: 'Urban Explorer Leather Backpack',
        description: 'Handcrafted genuine leather laptop backpack with padded 15.6" laptop compartment, multiple organization pockets, and anti-theft hidden back pocket. Water-resistant coating with vintage brass hardware.',
        price: 89.99,
        image: '/images/backpack.png',
        category: 'Fashion',
        countInStock: 32,
        rating: 4.8,
        numReviews: 67
    },
    {
        name: 'Velocity Pro Running Shoes',
        description: 'Lightweight performance running shoes with responsive foam midsole, breathable mesh upper, and carbon fiber plate for energy return. Designed for marathon training and daily runs. Available in multiple colorways.',
        price: 129.99,
        image: '/images/sneakers.png',
        category: 'Sports',
        countInStock: 45,
        rating: 4.6,
        numReviews: 203
    },
    {
        name: 'CaptureX Pro Mirrorless Camera',
        description: 'Professional 45MP full-frame mirrorless camera with 8K video recording, in-body image stabilization, and advanced AI autofocus. Dual card slots, weather-sealed body, and tilting touchscreen. Includes 24-70mm f/2.8 lens kit.',
        price: 1299.99,
        image: '/images/camera.png',
        category: 'Photography',
        countInStock: 8,
        rating: 4.9,
        numReviews: 42
    },
    {
        name: 'BassVibe Portable Speaker',
        description: 'Rugged portable Bluetooth speaker with 360° surround sound, deep bass, and 24-hour playtime. IP67 waterproof and dustproof rated. Features built-in power bank, LED light show mode, and stereo pairing capability.',
        price: 69.99,
        image: '/images/speaker.png',
        category: 'Audio',
        countInStock: 50,
        rating: 4.4,
        numReviews: 156
    },
    {
        name: 'MechStrike RGB Gaming Keyboard',
        description: 'Compact 75% mechanical gaming keyboard with hot-swappable switches, per-key RGB lighting, and programmable macros. Aluminum frame construction with PBT keycaps. USB-C and wireless Bluetooth connectivity.',
        price: 109.99,
        image: '/images/keyboard.png',
        category: 'Electronics',
        countInStock: 35,
        rating: 4.6,
        numReviews: 89
    },
    {
        name: 'Luxe Aviator Sunglasses',
        description: 'Premium polarized aviator sunglasses with titanium frame, scratch-resistant CR-39 lenses, and UV400 protection. Includes handcrafted leather case. Spring-loaded temple tips for comfortable all-day wear.',
        price: 59.99,
        image: '/images/sunglasses.png',
        category: 'Accessories',
        countInStock: 60,
        rating: 4.3,
        numReviews: 74
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});

        console.log('🗑️  Cleared existing data');

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@store.com',
            password: hashedPassword,
            isAdmin: true
        });

        console.log('👤 Admin user created: admin@store.com / admin123');

        // Create a test user
        const userPassword = await bcrypt.hash('user123', salt);
        await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: userPassword,
            isAdmin: false
        });

        console.log('👤 Test user created: john@example.com / user123');

        // Seed products
        await Product.insertMany(products);
        console.log(`📦 ${products.length} products seeded successfully`);

        console.log('\n✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Seed error: ${error.message}`);
        process.exit(1);
    }
};

seedDatabase();
