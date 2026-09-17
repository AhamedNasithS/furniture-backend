const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

const commonController = require("../controllers/controller");
const productController = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Get all products
router.get("/", productController.getProducts);

router.get(
  "/slug/:slug",
  productController.getProductBySlug
);

// Create product
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    productController.createProduct
);

router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    productController.updateProduct
);

// Get product details
router.get("/:id", productController.getProductById);

// Delete product
router.delete("/:id", authMiddleware, adminMiddleware, (req, res) => {
    return commonController.remove(Product, req, res);
});

router.get(
  "/:id/related",
  productController.getRelatedProducts
);


module.exports = router;