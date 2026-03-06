# ShopVerse — Premium E-Commerce Store

![ShopVerse Storefront](https://github.com/Compiler168/CodeAlpha_Simple-E-Commerce-Store/assets/placeholder-hero)

ShopVerse is a modern, fully responsive, and feature-rich full-stack e-commerce web application. Built with a robust **Node.js/Express** backend and a sleek, glassmorphic **Vanilla JS/CSS** frontend, this project delivers a premium shopping experience across all devices.

## ✨ Features

### 🛍️ Customer Experience
- **Responsive Design:** Flawless layout on desktop, tablet, and mobile (hamburger menus, adaptive grids).
- **Modern UI/UX:** Glassmorphism, smooth CSS animations, hover effects, and a cohesive brand color palette (Royal Blue & Vibrant Orange).
- **Product Discovery:** Browse products by category, view detailed product pages, and search in real-time.
- **Cart & Checkout:** Fully functional shopping cart with quantity management and order summary.
- **User Authentication:** Secure JWT-based login and registration system. 
- **Order Tracking:** Dedicated user profile area to view past orders and their status.

### 🛡️ Admin Dashboard (`/admin`)
- **Smart Redirection:** Admins logging in are automatically routed to the secure dashboard.
- **Metrics Overview:** Live statistics on sales, active users, total orders, and stock levels.
- **Product Management:** Full CRUD capabilities to add, edit, or remove products and images.
- **Order Management:** Track, process, and update the shipping statuses of customer orders.
- **User Management:** View registered users and their details.

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3 (Vanilla, custom variables, Flexbox/Grid), JavaScript (ES6+), FontAwesome Icons.
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas Cloud Database), Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT), bcryptjs (password hashing)
- **Environment:** `dotenv` for secure environment variable management.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Compiler168/CodeAlpha_Simple-E-Commerce-Store.git
   cd CodeAlpha_Simple-E-Commerce-Store
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory based on the provided `.env.example`:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_cluster_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Seed the Database (Optional)**
   If you want to populate the database with dummy products and users to test:
   ```bash
   npm run seed
   ```

5. **Start the Server**
   ```bash
   # For production mode
   npm start
   
   # For development mode (uses nodemon)
   npm run dev
   ```

6. **View the App**
   Open your browser and navigate to `http://localhost:5000`

## 🔑 Demo Access

If you used the `npm run seed` command, you can use the following accounts to test the application:

**Admin User:**
- **Email:** `admin@store.com`
- **Password:** `admin123`

**Regular User:**
- **Email:** `john@example.com`
- **Password:** `user123`

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Compiler168/CodeAlpha_Simple-E-Commerce-Store/issues).

---

*Designed and developed specifically as a functional showcase of full-stack e-commerce principles.*
