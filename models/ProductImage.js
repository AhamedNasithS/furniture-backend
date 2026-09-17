"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");

const ProductImage = sequelize.define(
  "ProductImage",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "product_images",
    timestamps: true,
  }
);

module.exports = ProductImage;