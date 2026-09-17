const { Op, fn, col } = require("sequelize");

const {
  User,
  Order,
  OrderItem,
  Product,
  Category,
} = require("../models");

const getStartDate = (period) => {
  const date = new Date();

  switch (period) {
    case "7d":
      date.setDate(date.getDate() - 7);
      break;

    case "90d":
      date.setDate(date.getDate() - 90);
      break;

    case "1y":
      date.setFullYear(date.getFullYear() - 1);
      break;

    case "30d":
    default:
      date.setDate(date.getDate() - 30);
  }

  date.setHours(0, 0, 0, 0);

  return date;
};


// GET ADMIN ANALYTICS
const getAnalytics = async (req, res) => {
  try {
    const allowedPeriods = [
      "7d",
      "30d",
      "90d",
      "1y",
    ];

    const period = allowedPeriods.includes(
      req.query.period
    )
      ? req.query.period
      : "30d";

    const startDate = getStartDate(period);

    const validOrderWhere = {
      createdAt: {
        [Op.gte]: startDate,
      },

      status: {
        [Op.ne]: "cancelled",
      },
    };

    const revenueWhere = {
      ...validOrderWhere,
      paymentStatus: "paid",
    };


    // SUMMARY DATA
    const [
      revenue,
      totalOrders,
      newCustomers,
      paidOrders,
    ] = await Promise.all([
      Order.sum("totalAmount", {
        where: revenueWhere,
      }),

      Order.count({
        where: validOrderWhere,
      }),

      User.count({
        where: {
          role: "customer",

          createdAt: {
            [Op.gte]: startDate,
          },
        },
      }),

      Order.count({
        where: revenueWhere,
      }),
    ]);


    const totalRevenue =
      Number(revenue) || 0;

    const averageOrderValue =
      paidOrders > 0
        ? totalRevenue / paidOrders
        : 0;


    // SALES TREND
    const salesTrend =
      await Order.findAll({
        where: revenueWhere,

        attributes: [
          [
            fn("DATE", col("createdAt")),
            "date",
          ],

          [
            fn(
              "SUM",
              col("totalAmount")
            ),
            "revenue",
          ],

          [
            fn("COUNT", col("id")),
            "orders",
          ],
        ],

        group: [
          fn("DATE", col("createdAt")),
        ],

        order: [
          [
            fn("DATE", col("createdAt")),
            "ASC",
          ],
        ],

        raw: true,
      });


    // ORDER STATUS BREAKDOWN
    const orderStatusBreakdown =
      await Order.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate,
          },
        },

        attributes: [
          "status",

          [
            fn("COUNT", col("id")),
            "count",
          ],
        ],

        group: ["status"],

        raw: true,
      });


    // TOP SELLING PRODUCTS
    const topProducts =
      await OrderItem.findAll({
        attributes: [
          "productId",
          "productName",

          [
            fn(
              "SUM",
              col("OrderItem.quantity")
            ),
            "unitsSold",
          ],

          [
            fn(
              "SUM",
              col("OrderItem.total")
            ),
            "revenue",
          ],
        ],

        include: [
          {
            model: Order,
            as: "order",

            attributes: [],

            where: validOrderWhere,
          },
        ],

        group: [
          "OrderItem.productId",
          "OrderItem.productName",
        ],

        order: [
          [
            fn(
              "SUM",
              col("OrderItem.quantity")
            ),
            "DESC",
          ],
        ],

        limit: 5,

        raw: true,
      });


    // CATEGORY PERFORMANCE
    const categoryPerformance =
      await OrderItem.findAll({
        attributes: [
          [
            col("product.category.id"),
            "categoryId",
          ],

          [
            col("product.category.name"),
            "categoryName",
          ],

          [
            fn(
              "SUM",
              col("OrderItem.quantity")
            ),
            "unitsSold",
          ],

          [
            fn(
              "SUM",
              col("OrderItem.total")
            ),
            "revenue",
          ],
        ],

        include: [
          {
            model: Order,
            as: "order",

            attributes: [],

            where: validOrderWhere,
          },

          {
            model: Product,
            as: "product",

            attributes: [],

            required: true,

            include: [
              {
                model: Category,
                as: "category",

                attributes: [],

                required: true,
              },
            ],
          },
        ],

        group: [
          "product.category.id",
          "product.category.name",
        ],

        order: [
          [
            fn(
              "SUM",
              col("OrderItem.total")
            ),
            "DESC",
          ],
        ],

        raw: true,
      });


    return res.status(200).json({
      success: true,

      data: {
        period,

        summary: {
          revenue: totalRevenue,

          orders: totalOrders,

          averageOrderValue:
            Number(
              averageOrderValue.toFixed(2)
            ),

          newCustomers,
        },

        salesTrend:
          salesTrend.map((item) => ({
            date: item.date,
            revenue:
              Number(item.revenue) || 0,
            orders:
              Number(item.orders) || 0,
          })),

        topProducts:
          topProducts.map((item) => ({
            productId: item.productId,
            name: item.productName,
            unitsSold:
              Number(item.unitsSold) || 0,
            revenue:
              Number(item.revenue) || 0,
          })),

        categoryPerformance:
          categoryPerformance.map(
            (item) => ({
              categoryId:
                item.categoryId,

              categoryName:
                item.categoryName,

              unitsSold:
                Number(item.unitsSold) ||
                0,

              revenue:
                Number(item.revenue) ||
                0,
            })
          ),

        orderStatusBreakdown:
          orderStatusBreakdown.map(
            (item) => ({
              status: item.status,
              count:
                Number(item.count) || 0,
            })
          ),
      },
    });

  } catch (error) {
    console.error(
      "Analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = {
  getAnalytics,
};