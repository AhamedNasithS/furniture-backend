const {
  Op,
  fn,
  col,
} = require("sequelize");

const {
  User,
  Address,
  Order,
  OrderItem,
} = require("../models");


// GET ALL CUSTOMERS
const getCustomers = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {
      role: "customer",
    };

    if (search) {
      where[Op.or] = [
        {
          name: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.like]: `%${search}%`,
          },
        },
      ];
    }

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    const offset =
      (currentPage - 1) * pageLimit;

    // Get paginated customers
    const { count, rows } =
      await User.findAndCountAll({
        where,

        attributes: {
          exclude: ["password"],
        },

        limit: pageLimit,
        offset,

        order: [
          ["createdAt", "DESC"],
        ],
      });


    const userIds = rows.map(
      (user) => user.id
    );


    let orderStats = [];

    if (userIds.length > 0) {
      orderStats = await Order.findAll({
        where: {
          userId: {
            [Op.in]: userIds,
          },
        },

        attributes: [
          "userId",

          [
            fn("COUNT", col("id")),
            "orderCount",
          ],

          [
            fn("SUM", col("totalAmount")),
            "totalSpent",
          ],
        ],

        group: ["userId"],

        raw: true,
      });
    }


    const statsMap = {};

    orderStats.forEach((item) => {
      statsMap[item.userId] = {
        orderCount:
          Number(item.orderCount) || 0,

        totalSpent:
          Number(item.totalSpent) || 0,
      };
    });


    const customers = rows.map(
      (user) => ({
        ...user.toJSON(),

        orderCount:
          statsMap[user.id]?.orderCount || 0,

        totalSpent:
          statsMap[user.id]?.totalSpent || 0,
      })
    );


    return res.status(200).json({
      success: true,

      data: customers,

      pagination: {
        totalItems: count,
        currentPage,
        totalPages:
          Math.ceil(count / pageLimit),
        limit: pageLimit,
      },
    });

  } catch (error) {
    console.error(
      "Get customers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// GET CUSTOMER DETAILS
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findOne({
      where: {
        id,
        role: "customer",
      },

      attributes: {
        exclude: ["password"],
      },

      include: [
        {
          model: Address,
          as: "addresses",
        },

        {
          model: Order,
          as: "orders",

          include: [
            {
              model: OrderItem,
              as: "items",
            },
          ],
        },
      ],

      order: [
        [
          { model: Order, as: "orders" },
          "createdAt",
          "DESC",
        ],
      ],
    });


    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }


    const customerData =
      customer.toJSON();

    const orderCount =
      customerData.orders.length;

    const totalSpent =
      customerData.orders
        .filter(
          (order) =>
            order.status !== "cancelled"
        )
        .reduce(
          (total, order) =>
            total +
            Number(order.totalAmount),
          0
        );


    return res.status(200).json({
      success: true,

      data: {
        ...customerData,
        orderCount,
        totalSpent,
      },
    });

  } catch (error) {
    console.error(
      "Get customer details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = {
  getCustomers,
  getCustomerById,
};