const express = require("express");
const router = express.Router();

const customerController =
  require("../controllers/customerController");

const authMiddleware =
  require("../middleware/authMiddleware");


router.get(
  "/profile",
  authMiddleware,
  customerController.getProfile
);

router.put(
  "/profile",
  authMiddleware,
  customerController.updateProfile
);

router.put(
  "/changePassword",
  authMiddleware,
  customerController.changePassword
);


module.exports = router;