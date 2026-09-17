const express = require("express");

const router = express.Router();

const Category = require("../models/Category");
const commonController = require("../controllers/controller");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Get all categories
// PUBLIC - active categories only
router.get("/", (req, res) => {
  return commonController.getAll(
    Category,
    req,
    res,
    {
      where: {
        status: "active",
      },

      order: [
        ["name", "ASC"],
      ],
    }
  );
});

// ADMIN - all categories
router.get(
  "/all",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    return commonController.getAll(
      Category,
      req,
      res,
      {
        order: [
          ["name", "ASC"],
        ],
      }
    );
  }
);

// Get category by ID
router.get("/:id", (req, res) => {
  return commonController.getById(Category, req, res);
});

// Create category
router.post("/", authMiddleware, adminMiddleware, (req, res) => {
  return commonController.create(Category, req, res);
});

// Update category
router.put("/:id", authMiddleware, adminMiddleware, (req, res) => {
  return commonController.update(Category, req, res);
});

// Delete category
router.delete("/:id", authMiddleware, adminMiddleware, (req, res) => {
  return commonController.remove(Category, req, res);
});

module.exports = router;