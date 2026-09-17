const express = require("express");
const router = express.Router();

const reviewController =
  require("../controllers/reviewController");

const authMiddleware =
  require("../middleware/authMiddleware");


// Public
router.get(
  "/product/:productId",
  reviewController.getProductReviews
);

// Customer
router.post(
  "/product/:productId",
  authMiddleware,
  reviewController.createReview
);

router.put(
  "/:id",
  authMiddleware,
  reviewController.updateReview
);

router.delete(
  "/:id",
  authMiddleware,
  reviewController.deleteReview
);


module.exports = router;