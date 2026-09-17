const express = require("express");
const router = express.Router();

const adminCustomerController =
  require("../controllers/adminCustomerController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");


router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  adminCustomerController.getCustomers
);

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  adminCustomerController.getCustomerById
);


module.exports = router;