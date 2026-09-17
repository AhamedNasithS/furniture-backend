const express = require("express");
const router = express.Router();

const adminAnalyticsController =
  require("../controllers/adminAnalyticsController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");


router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  adminAnalyticsController.getAnalytics
);


module.exports = router;