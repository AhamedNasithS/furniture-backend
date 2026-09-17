const { Op } = require("sequelize");

const {
  Product,
  Category,
  ProductImage,
  StoreSetting,
} = require("../models");

const getLowStockThreshold = async () => {
  const settings = await StoreSetting.findByPk(1);

  return settings?.lowStockThreshold ?? 5;
};


// GET INVENTORY
const getInventory = async (req, res) => {
  try {
    const lowStockThreshold =
      await getLowStockThreshold();

    const {
      search,
      stockStatus,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        {
          name: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          sku: {
            [Op.like]: `%${search}%`,
          },
        },
      ];
    }

    if (stockStatus === "out") {
      where.stock = 0;
    }

    if (stockStatus === "low") {
      where.stock = {
        [Op.between]: [
          1,
          lowStockThreshold,
        ],
      };
    }

    if (stockStatus === "in") {
      where.stock = {
        [Op.gt]: lowStockThreshold,
      };
    }

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    const offset =
      (currentPage - 1) * pageLimit;

    const { count, rows } =
      await Product.findAndCountAll({
        where,

        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
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

        limit: pageLimit,
        offset,
        distinct: true,

        order: [
          ["stock", "ASC"],
          ["name", "ASC"],
        ],
      });

    const products = rows.map(
      (product) => {
        const data = product.toJSON();

        let stockStatus = "in_stock";

        if (data.stock === 0) {
          stockStatus = "out_of_stock";
        } else if (
          data.stock <= lowStockThreshold
        ) {
          stockStatus = "low_stock";
        }

        return {
          ...data,
          stockStatus,
        };
      }
    );

    return res.status(200).json({
      success: true,
      data: products,

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
      "Get inventory error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// UPDATE STOCK
const updateStock = async (req, res) => {
  try {
    const lowStockThreshold =
      await getLowStockThreshold();

    const { productId } = req.params;
    const { stock } = req.body;

    if (
      stock === undefined ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock must be a non-negative integer",
      });
    }

    const product =
      await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.stock = Number(stock);

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Stock updated successfully",

      data: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,

        stockStatus:
          product.stock === 0
            ? "out_of_stock"
            : product.stock <=
              lowStockThreshold
            ? "low_stock"
            : "in_stock",
      },
    });

  } catch (error) {
    console.error(
      "Update stock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = {
  getInventory,
  updateStock,
};