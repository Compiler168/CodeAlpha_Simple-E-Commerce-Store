const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: 0
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/400x400?text=Product'
    },
    category: {
        type: String,
        required: [true, 'Product category is required']
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Auto-generate productId before saving
productSchema.pre('save', async function (next) {
    if (!this.productId) {
        const count = await mongoose.model('Product').countDocuments();
        this.productId = `PRD-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
