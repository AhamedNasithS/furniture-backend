const { Op } = require("sequelize");
const sequelize = require("../dbConfig");

const {
  Order,
  OrderItem,
  User,
  Product,
  ProductImage,
} = require("../models");


// GET ALL ORDERS - ADMIN
const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (search) {
      where.orderNumber = {
        [Op.like]: `%${search}%`,
      };
    }

    const currentPage = Number(page);
    const pageLimit = Number(limit);
    const offset = (currentPage - 1) * pageLimit;

    const { count, rows } = await Order.findAndCountAll({
      where,

      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],

      limit: pageLimit,
      offset,

      order: [["createdAt", "DESC"]],

      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: rows,

      pagination: {
        totalItems: count,
        currentPage,
        totalPages: Math.ceil(count / pageLimit),
        limit: pageLimit,
      },
    });

  } catch (error) {
    console.error("Get admin orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// GET SINGLE ORDER - ADMIN
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },

        {
          model: OrderItem,
          as: "items",

          include: [
            {
              model: Product,
              as: "product",

              include: [
                {
                  model: ProductImage,
                  as: "images",
                  attributes: [
                    "id",
                    "imageUrl",
                    "isPrimary",
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error) {
    console.error("Get admin order error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: "items",
        },
      ],
      transaction,
    });

    if (!order) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Do not process completed/cancelled orders again
    if (
      order.status === "delivered" ||
      order.status === "cancelled"
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "This order status cannot be changed",
      });
    }

    // Restore stock if cancelling order
    if (status === "cancelled") {
      for (const item of order.items) {
        if (item.productId) {
          await Product.increment(
            {
              stock: item.quantity,
            },
            {
              where: {
                id: item.productId,
              },
              transaction,
            }
          );
        }
      }
    }

    order.status = status;

    await order.save({
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// UPDATE PAYMENT STATUS
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentStatus = paymentStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: order,
    });

  } catch (error) {
    console.error("Update payment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
};