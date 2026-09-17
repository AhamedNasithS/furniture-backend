const express = require("express");
const router = express.Router();

const productImageController = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Public - get product images
router.get(
  "/product/:productId",
  productImageController.getProductImages
);

// Admin - add product image
router.post(
  "/product/:productId",
  authMiddleware,
  adminMiddleware,
  productImageController.createProductImage
);

// Admin - update product image
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productImageController.updateProductImage
);

// Admin - delete product image
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productImageController.deleteProductImage
);

module.exports = router;