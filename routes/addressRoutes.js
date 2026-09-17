const express = require("express");
const router = express.Router();

const addressController = require("../controllers/addressController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, addressController.getAddresses);

router.get("/:id", authMiddleware, addressController.getAddressById);

router.post("/", authMiddleware, addressController.createAddress);

router.put("/:id", authMiddleware, addressController.updateAddress);

router.delete("/:id", authMiddleware, addressController.deleteAddress);

router.patch(
  "/:id/default",
  authMiddleware,
  addressController.setDefaultAddress
);

module.exports = router;