const { StoreSetting } = require("../models");

const getSettings = async (req, res) => {
  try {
    const [settings] = await StoreSetting.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        storeName: "FTC Furniture",
        currency: "INR",
        shippingFee: 0,
        lowStockThreshold: 5,
        orderPrefix: "FTC",
        emailNotifications: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


const updateSettings = async (req, res) => {
  try {
    const [settings] = await StoreSetting.findOrCreate({
      where: { id: 1 },
      defaults: { id: 1 },
    });

    const {
      storeName,
      supportEmail,
      supportPhone,
      currency,
      shippingFee,
      freeShippingThreshold,
      lowStockThreshold,
      orderPrefix,
      emailNotifications,
      heroImageUrl,
    } = req.body;

    if (
      shippingFee !== undefined &&
      Number(shippingFee) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Shipping fee cannot be negative",
      });
    }

    if (
      lowStockThreshold !== undefined &&
      Number(lowStockThreshold) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Low stock threshold cannot be negative",
      });
    }

    await settings.update({
      storeName:
        storeName !== undefined
          ? storeName
          : settings.storeName,

      supportEmail:
        supportEmail !== undefined
          ? supportEmail
          : settings.supportEmail,

      supportPhone:
        supportPhone !== undefined
          ? supportPhone
          : settings.supportPhone,

      currency:
        currency !== undefined
          ? currency
          : settings.currency,

      shippingFee:
        shippingFee !== undefined
          ? shippingFee
          : settings.shippingFee,

      freeShippingThreshold:
        freeShippingThreshold !== undefined
          ? freeShippingThreshold
          : settings.freeShippingThreshold,

      lowStockThreshold:
        lowStockThreshold !== undefined
          ? lowStockThreshold
          : settings.lowStockThreshold,

      orderPrefix:
        orderPrefix !== undefined
          ? orderPrefix
          : settings.orderPrefix,

      emailNotifications:
        emailNotifications !== undefined
          ? emailNotifications
          : settings.emailNotifications,
    });

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });

  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getPublicSettings = async (req, res) => {
  try {
    const [settings] =
      await StoreSetting.findOrCreate({
        where: { id: 1 },
        defaults: {
          id: 1,
          storeName: "FTC Furniture",
          currency: "INR",
          shippingFee: 0,
          lowStockThreshold: 5,
          orderPrefix: "FTC",
          emailNotifications: true,
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        storeName: settings.storeName,
        currency: settings.currency,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        shippingFee: settings.shippingFee,
        freeShippingThreshold:
          settings.freeShippingThreshold,
      },
    });
  } catch (error) {
    console.error(
      "Get public settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = {
  getSettings,
  updateSettings,
  getPublicSettings,
};