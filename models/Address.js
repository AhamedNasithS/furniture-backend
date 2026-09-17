"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");

const Address = sequelize.define(
  "Address",
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

    fullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "India",
    },

    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "addresses",
    timestamps: true,
  }
);

module.exports = Address;