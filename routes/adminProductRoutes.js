const express = require("express");
const router = express.Router();

const productController =
  require("../controllers/productController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");


router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  productController.getAdminProducts
);

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.getAdminProductById
);


module.exports = router;