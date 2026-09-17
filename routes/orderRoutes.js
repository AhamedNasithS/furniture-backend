const express = require("express");
const router = express.Router();

const orderController =
  require("../controllers/orderController");

const authMiddleware =
  require("../middleware/authMiddleware");


// Checkout / place order
router.post(
  "/",
  authMiddleware,
  orderController.createOrder
);

// My orders
router.get(
  "/",
  authMiddleware,
  orderController.getMyOrders
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  orderController.cancelOrder
);

// Single order
router.get(
  "/:id",
  authMiddleware,
  orderController.getOrderById
);


module.exports = router;