"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");

const Wishlist = sequelize.define(
  "Wishlist",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "wishlists",
    timestamps: true,
  }
);

module.exports = Wishlist;