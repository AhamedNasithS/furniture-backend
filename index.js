require("dotenv").config();
require("./models");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const http = require("http");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const productImageRoutes = require("./routes/productImageRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminCustomerRoutes = require("./routes/adminCustomerRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");
const adminSettingsRoutes = require("./routes/adminSettingsRoutes");
const adminProductRoutes = require("./routes/adminProductRoutes");
const reviewRoutes =
  require("./routes/reviewRoutes");

const sequelize = require("./dbConfig");

const app = express();

const server = http.createServer(app);

const PORT = process.env.PORT || 5001;

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5001",
    credentials: true,
  })
);

// Logger
app.use(morgan("dev"));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/productImages", productImageRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin/orders", adminOrderRoutes);
app.use("/api/v1/customer", customerRoutes);

app.use("/api/v1/admin/customers", adminCustomerRoutes);
app.use("/api/v1/admin/inventory", inventoryRoutes);
app.use("/api/v1/admin/dashboard", adminDashboardRoutes);
app.use("/api/v1/admin/analytics", adminAnalyticsRoutes);
app.use("/api/v1/admin/settings", adminSettingsRoutes);
app.use("/api/v1/admin/products", adminProductRoutes);
app.use(
  "/api/v1/reviews",
  reviewRoutes
);


// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Furniture E-Commerce API is running",
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});