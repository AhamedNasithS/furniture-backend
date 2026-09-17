const { Op } = require("sequelize");
const {
  User,
  Address,
  Order,
  OrderItem,
} = require("../models");
const bcrypt = require("bcrypt");


// GET LOGGED-IN CUSTOMER PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: {
        exclude: ["password"],
      },

      include: [
        {
          model: Address,
          as: "addresses",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// UPDATE LOGGED-IN CUSTOMER PROFILE
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { name, email } = req.body;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: {
            [Op.ne]: userId,
          },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    await user.update({
      name: name ?? user.name,
      email: email ?? user.email,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",

      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCorrect =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isCorrect) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect",
      });
    }

    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully",
    });

  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = {
  getProfile,
  updateProfile,
  changePassword
};