const express = require("express");
const router = express.Router();

const authService = require("../services/authService");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const data = await authService.login(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error) {
    console.error("Login error:", error);

    if (
      error.message === "Email and password are required" ||
      error.message === "Invalid email or password"
    ) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

module.exports = router;