const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, cartController.getCart);

router.post("/", authMiddleware, cartController.addToCart);

router.put(
  "/:productId",
  authMiddleware,
  cartController.updateCartItem
);

router.delete(
  "/:productId",
  authMiddleware,
  cartController.removeCartItem
);

module.exports = router;