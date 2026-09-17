"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");

const Cart = sequelize.define(
  "Cart",
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
      unique: true,
    },
  },
  {
    tableName: "carts",
    timestamps: true,
  }
);

module.exports = Cart;