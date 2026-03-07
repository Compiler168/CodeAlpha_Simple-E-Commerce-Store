/**
 * config/db.js
 * ─────────────────────────────────────────────────────────────
 * MongoDB Atlas connection module for ShopVerse E-Commerce Store
 *
 * Project   : CodeAlpha (Driven's Org - 2026-03-06)
 * Database  : ecommerce_store
 * Cluster   : Cluster0 → cluster0.rpbqm2z.mongodb.net
 * Shards    : ac-byfci8g-shard-00-00/01/02.rpbqm2z.mongodb.net
 * Collections: users · products · categories · orders
 *
 * NOTE: Uses direct shard hostnames (not mongodb+srv://) to
 * bypass ISP-level SRV/TXT DNS blocking on port 53 UDP.
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

// ── Connection event listeners ──────────────────────────────
mongoose.connection.on('connected', () => {
  const db = mongoose.connection.db?.databaseName ?? 'ecommerce_store';
  const host = mongoose.connection.host;
  console.log('\n✅ MongoDB Atlas Connected');
  console.log(`   Database : ${db}`);
  console.log(`   Shard    : ${host}\n`);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB Atlas disconnected');
});

// ── Mongoose options ────────────────────────────────────────
const CONNECT_OPTS = {
  serverSelectionTimeoutMS: 15000,   // 15 s to elect a primary
  connectTimeoutMS: 15000,   // 15 s to open a socket
  socketTimeoutMS: 45000,   // 45 s idle socket timeout
};

// ── Main connect function ───────────────────────────────────
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return; // Already connected, critical for Vercel serverless environment
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not defined in your .env file.');
    console.error('    Add it to .env:  MONGODB_URI=mongodb://...');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, CONNECT_OPTS);
    // ✅  "connected" event listener above logs success
  } catch (err) {
    console.error('\n❌  Unable to connect to MongoDB Atlas:', err.message);
    console.error('');
    console.error('    ── Troubleshooting checklist ──────────────────────────────');
    console.error('    1. Atlas Dashboard → Clusters → confirm "Cluster0" is ACTIVE');
    console.error('       https://cloud.mongodb.com/v2/69aa382f1a4608ed6e52b496#/clusters');
    console.error('    2. Atlas → Network Access → confirm 0.0.0.0/0 is whitelisted');
    console.error('       https://cloud.mongodb.com/v2/69aa382f1a4608ed6e52b496#/security/network/accessList');
    console.error('    3. Atlas → Database Access → confirm user "drivenage3_db_user" has');
    console.error('       readWrite access on "ecommerce_store" (or Any Database)');
    console.error('    4. Verify MONGODB_URI in your .env matches the direct shard string');
    console.error('    ───────────────────────────────────────────────────────────');
    process.exit(1);
  }
};

// ── Graceful shutdown ───────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n${signal} received — closing MongoDB connection...`);
  await mongoose.connection.close();
  console.log('MongoDB connection closed. Goodbye! 👋');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = connectDB;
