const {
  Op,
  fn,
  col,
  literal,
} = require("sequelize");

const {
  User,
  Product,
  Category,
  ProductImage,
  Order,
  OrderItem,
  StoreSetting
} = require("../models");

const getDashboard = async (req, res) => {
  try {
    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const settings =
      await StoreSetting.findByPk(1);

    const lowStockThreshold =
      settings?.lowStockThreshold ?? 5;

    const [
      revenueResult,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      lowStockProducts,
      salesOverview,
      topSellingRaw,
    ] = await Promise.all([
      // TOTAL REVENUE
      Order.sum("totalAmount", {
        where: {
          paymentStatus: "paid",
          status: {
            [Op.ne]: "cancelled",
          },
        },
      }),

      // TOTAL ORDERS
      Order.count({
        where: {
          status: {
            [Op.ne]: "cancelled",
          },
        },
      }),

      // TOTAL CUSTOMERS
      User.count({
        where: {
          role: "customer",
        },
      }),

      // TOTAL PRODUCTS
      Product.count(),

      // RECENT ORDERS
      Order.findAll({
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "id",
              "name",
              "email",
            ],
          },
        ],

        limit: 5,

        order: [
          ["createdAt", "DESC"],
        ],
      }),

      // LOW STOCK
      Product.findAll({
        where: {
          stock: {
            [Op.lte]: lowStockThreshold,
          },
        },

        include: [
          {
            model: Category,
            as: "category",
            attributes: [
              "id",
              "name",
            ],
          },

          {
            model: ProductImage,
            as: "images",
            attributes: [
              "id",
              "imageUrl",
              "isPrimary",
            ],
            required: false,
          },
        ],

        limit: 5,

        order: [
          ["stock", "ASC"],
        ],
      }),

      // SALES OVERVIEW - LAST 7 DAYS
      Order.findAll({
        where: {
          createdAt: {
            [Op.gte]: sevenDaysAgo,
          },

          status: {
            [Op.ne]: "cancelled",
          },
        },

        attributes: [
          [
            fn(
              "DATE",
              col("createdAt")
            ),
            "date",
          ],

          [
            fn(
              "SUM",
              col("totalAmount")
            ),
            "sales",
          ],

          [
            fn(
              "COUNT",
              col("id")
            ),
            "orders",
          ],
        ],

        group: [
          literal(
            "DATE(createdAt)"
          ),
        ],

        order: [
          [
            literal(
              "DATE(createdAt)"
            ),
            "ASC",
          ],
        ],

        raw: true,
      }),

      // TOP SELLING PRODUCTS
      OrderItem.findAll({
        attributes: [
          "productId",
          "productName",

          [
            fn(
              "SUM",
              col("quantity")
            ),
            "totalSold",
          ],

          [
            fn(
              "SUM",
              col("total")
            ),
            "revenue",
          ],
        ],

        group: [
          "productId",
          "productName",
        ],

        order: [
          [
            literal("totalSold"),
            "DESC",
          ],
        ],

        limit: 5,

        raw: true,
      }),
    ]);

    // Add basic product information
    // to top-selling products
    const topSellingProducts =
      await Promise.all(
        topSellingRaw.map(
          async (item) => {
            const product =
              item.productId
                ? await Product.findByPk(
                  item.productId,
                  {
                    include: [
                      {
                        model:
                          ProductImage,
                        as: "images",
                        attributes: [
                          "id",
                          "imageUrl",
                          "isPrimary",
                        ],
                        required: false,
                      },
                    ],
                  }
                )
                : null;

            return {
              productId:
                item.productId,

              name:
                item.productName,

              totalSold:
                Number(
                  item.totalSold
                ),

              revenue:
                Number(
                  item.revenue
                ),

              images:
                product?.images || [],
            };
          }
        )
      );

    return res.status(200).json({
      success: true,

      data: {
        stats: {
          revenue:
            Number(
              revenueResult
            ) || 0,

          orders:
            totalOrders,

          customers:
            totalCustomers,

          products:
            totalProducts,
        },

        salesOverview,

        recentOrders,

        lowStockProducts,

        topSellingProducts,
      },
    });

  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong",
    });
  }
};

module.exports = {
  getDashboard,
};