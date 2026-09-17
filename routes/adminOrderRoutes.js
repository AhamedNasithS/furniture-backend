const express = require("express");
const router = express.Router();

const adminOrderController =
  require("../controllers/adminOrderController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");


router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  adminOrderController.getAllOrders
);

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  adminOrderController.getOrderById
);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  adminOrderController.updateOrderStatus
);

router.patch(
  "/:id/paymentStatus",
  authMiddleware,
  adminMiddleware,
  adminOrderController.updatePaymentStatus
);


module.exports = router;