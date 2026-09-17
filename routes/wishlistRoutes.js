const express = require("express");
const router = express.Router();

const wishlistController = require("../controllers/wishlistController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, wishlistController.getWishlist);

router.post("/", authMiddleware, wishlistController.addToWishlist);

router.delete(
  "/:productId",
  authMiddleware,
  wishlistController.removeFromWishlist
);

router.post(
  "/:productId/moveToCart",
  authMiddleware,
  wishlistController.moveToCart
);

module.exports = router;