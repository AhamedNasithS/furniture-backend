const User = require("./User");
const Category = require("./Category");
const Product = require("./Product");
const ProductImage = require("./ProductImage");
const Address = require("./Address");
const Cart = require("./Cart");
const CartItem = require("./CartItem");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Wishlist = require("./Wishlist");
const StoreSetting = require("./StoreSetting");
const Review = require("./Review");

// User -> Address
User.hasMany(Address, {
  foreignKey: "userId",
  as: "addresses",
});

Address.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User -> Cart
User.hasOne(Cart, {
  foreignKey: "userId",
  as: "cart",
});

Cart.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Cart -> CartItems
Cart.hasMany(CartItem, {
  foreignKey: "cartId",
  as: "items",
});

CartItem.belongsTo(Cart, {
  foreignKey: "cartId",
  as: "cart",
});

// Product -> CartItems
Product.hasMany(CartItem, {
  foreignKey: "productId",
  as: "cartItems",
});

CartItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

// Category -> Products
Category.hasMany(Product, {
  foreignKey: "categoryId",
  as: "products",
});

Product.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

// Product -> ProductImages
Product.hasMany(ProductImage, {
  foreignKey: "productId",
  as: "images",
});

ProductImage.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

// User -> Orders
User.hasMany(Order, {
  foreignKey: "userId",
  as: "orders",
});

Order.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Order -> OrderItems
Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
});

OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

// Product -> OrderItems
Product.hasMany(OrderItem, {
  foreignKey: "productId",
  as: "orderItems",
});

OrderItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

User.hasMany(Wishlist, {
  foreignKey: "userId",
  as: "wishlistItems",
});

Wishlist.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Product.hasMany(Wishlist, {
  foreignKey: "productId",
  as: "wishlistItems",
});

Wishlist.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

User.hasMany(Review, {
  foreignKey: "userId",
  as: "reviews",
});

Review.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Product.hasMany(Review, {
  foreignKey: "productId",
  as: "reviews",
});

Review.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

module.exports = {
  User,
  Category,
  Product,
  ProductImage,
  Address,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Wishlist,
  StoreSetting,
  Review,
};