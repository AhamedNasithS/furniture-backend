"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    discountPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    material: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    color: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    depth: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "products",
    timestamps: true,
  }
);

module.exports = Product;