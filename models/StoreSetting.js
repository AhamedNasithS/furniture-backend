"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");

const StoreSetting = sequelize.define(
  "StoreSetting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },

    storeName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: "FTC Furniture",
    },

    supportEmail: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    supportPhone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "INR",
    },

    shippingFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    freeShippingThreshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    lowStockThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },

    orderPrefix: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "FTC",
    },

    emailNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    heroImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "store_settings",
    timestamps: true,
  }
);

module.exports = StoreSetting;