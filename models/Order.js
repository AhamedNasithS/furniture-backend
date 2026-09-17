"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    paymentStatus: {
      type: DataTypes.ENUM(
        "pending",
        "paid",
        "failed",
        "refunded"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    shippingFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    shippingFullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    shippingPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    shippingAddressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    shippingAddressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    shippingCity: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    shippingState: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    shippingPostalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    shippingCountry: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "India",
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

module.exports = Order;
