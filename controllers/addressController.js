const { Address } = require("../models");

// GET ALL ADDRESSES FOR LOGGED-IN USER
const getAddresses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const addresses = await Address.findAll({
      where: { userId },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// GET ONE ADDRESS
const getAddressById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const address = await Address.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("Get address error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// CREATE ADDRESS
const createAddress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = "India",
      isDefault = false,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Required address fields are missing",
      });
    }

    // If this becomes default, remove old default
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        {
          where: { userId },
        }
      );
    }

    // If user has no address, make first one default automatically
    const addressCount = await Address.count({
      where: { userId },
    });

    const address = await Address.create({
      userId,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault: addressCount === 0 ? true : isDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    console.error("Create address error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// UPDATE ADDRESS
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const address = await Address.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (req.body.isDefault === true) {
      await Address.update(
        { isDefault: false },
        {
          where: { userId },
        }
      );
    }

    await address.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    console.error("Update address error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// DELETE ADDRESS
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const address = await Address.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;

    await address.destroy();

    // If default address deleted, make another address default
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        where: { userId },
        order: [["createdAt", "DESC"]],
      });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// SET DEFAULT ADDRESS
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const address = await Address.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await Address.update(
      { isDefault: false },
      {
        where: { userId },
      }
    );

    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated",
      data: address,
    });
  } catch (error) {
    console.error("Set default address error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};