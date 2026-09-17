const express = require("express");
const router = express.Router();

const adminDashboardController =
  require("../controllers/adminDashboardController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  adminDashboardController.getDashboard
);

module.exports = router;