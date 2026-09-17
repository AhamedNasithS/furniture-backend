const express = require("express");
const router = express.Router();

const adminSettingsController =
  require("../controllers/adminSettingsController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");


router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  adminSettingsController.getSettings
);

router.put(
  "/",
  authMiddleware,
  adminMiddleware,
  adminSettingsController.updateSettings
);

router.get(
  "/public",
  adminSettingsController.getPublicSettings
);

module.exports = router;