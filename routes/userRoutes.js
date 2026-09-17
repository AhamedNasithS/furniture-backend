const express = require("express");
const router = express.Router();

const userService = require("../services/userService");

router.post("/", async (req, res) => {
  try {
    const data = await userService.createUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data,
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (error.message === "Name, email and password are required") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "User with this email already exists") {
      return res.status(409).json({
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