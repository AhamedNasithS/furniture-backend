const { Op, fn, col, } = require("sequelize");
const {
  Product,
  Category,
  ProductImage,
  Review,
} = require("../models");


const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getRatingStats = async (productIds) => {
  if (!productIds.length) {
    return {};
  }

  const stats = await Review.findAll({
    where: {
      productId: {
        [Op.in]: productIds,
      },
    },

    attributes: [
      "productId",

      [
        fn("AVG", col("rating")),
        "averageRating",
      ],

      [
        fn("COUNT", col("id")),
        "reviewCount",
      ],
    ],

    group: ["productId"],

    raw: true,
  });

  const ratingMap = {};

  stats.forEach((item) => {
    ratingMap[item.productId] = {
      averageRating: Number(
        Number(
          item.averageRating || 0
        ).toFixed(1)
      ),

      reviewCount:
        Number(item.reviewCount) || 0,
    };
  });

  return ratingMap;
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const {
      categoryId,
      name,
      description,
      price,
      discountPrice,
      stock = 0,
      sku,
      status = "active",
      material,
      color,
      width,
      height,
      depth,
    } = req.body;

    if (!categoryId || !name || price === undefined || !sku) {
      return res.status(400).json({
        success: false,
        message: "Category, name, price and SKU are required",
      });
    }

    // Check category exists
    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const slug = createSlug(name);

    // Check duplicate slug
    const existingSlug = await Product.findOne({
      where: { slug },
    });

    if (existingSlug) {
      return res.status(409).json({
        success: false,
        message: "Product with this name already exists",
      });
    }

    // Check duplicate SKU
    const existingSku = await Product.findOne({
      where: { sku },
    });

    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
    }

    if (
      discountPrice !== undefined &&
      discountPrice !== null &&
      Number(discountPrice) >= Number(price)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount price must be lower than regular price",
      });
    }

    const product = await Product.create({
      categoryId,
      name,
      slug,
      description,
      price,
      discountPrice: discountPrice ?? null,
      stock,
      sku,
      status,
      material,
      color,
      width,
      height,
      depth,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      categoryId,
      name,
      description,
      price,
      discountPrice,
      stock,
      sku,
      status,
      material,
      color,
      width,
      height,
      depth,
    } = req.body;

    // Check category if changing it
    if (categoryId) {
      const category = await Category.findByPk(categoryId);

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
    }

    // Check SKU belongs to another product
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findOne({
        where: { sku },
      });

      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    const finalPrice =
      price !== undefined
        ? Number(price)
        : Number(product.price);

    const finalDiscountPrice =
      discountPrice !== undefined
        ? discountPrice === null
          ? null
          : Number(discountPrice)
        : product.discountPrice !== null
          ? Number(product.discountPrice)
          : null;

    if (
      finalDiscountPrice !== null &&
      finalDiscountPrice >= finalPrice
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount price must be lower than regular price",
      });
    }

    await product.update({
      categoryId: categoryId ?? product.categoryId,
      name: name ?? product.name,

      // Keep existing slug during edit
      description: description ?? product.description,
      price: price ?? product.price,
      discountPrice: finalDiscountPrice,
      stock: stock ?? product.stock,
      sku: sku ?? product.sku,
      status: status ?? product.status,
      material: material ?? product.material,
      color: color ?? product.color,
      width: width ?? product.width,
      height: height ?? product.height,
      depth: depth ?? product.depth,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      material,
      color,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const where = {
      status: "active",
    };

    if (search) {
      where.name = {
        [Op.like]: `%${search}%`,
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      where.price = {};

      if (minPrice) {
        where.price[Op.gte] =
          Number(minPrice);
      }

      if (maxPrice) {
        where.price[Op.lte] =
          Number(maxPrice);
      }
    }

    if (material) {
      where.material = material;
    }

    if (color) {
      where.color = color;
    }

    let order = [
      ["createdAt", "DESC"],
    ];

    if (sort === "price_asc") {
      order = [["price", "ASC"]];
    }

    if (sort === "price_desc") {
      order = [["price", "DESC"]];
    }

    if (sort === "name_asc") {
      order = [["name", "ASC"]];
    }

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const currentPage =
      Number.isInteger(parsedPage) && parsedPage > 0
        ? parsedPage
        : 1;

    const pageLimit =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 12;

    const offset =
      (currentPage - 1) *
      pageLimit;

    const { count, rows } =
      await Product.findAndCountAll({
        where,

        include: [
          {
            model: Category,
            as: "category",

            where: {
              status: "active",
            },

            attributes: [
              "id",
              "name",
              "slug",
            ],

            required: true,
          },

          {
            model: ProductImage,
            as: "images",
            attributes: [
              "id",
              "imageUrl",
              "sortOrder",
              "isPrimary",
            ],
            required: false,
          },
        ],

        limit: pageLimit,
        offset,
        distinct: true,
        order,
      });

    const productIds = rows.map(
      (product) => product.id
    );

    const ratingMap =
      await getRatingStats(productIds);

    const products = rows.map(
      (product) => {
        const data = product.toJSON();

        return {
          ...data,

          averageRating:
            ratingMap[data.id]
              ?.averageRating || 0,

          reviewCount:
            ratingMap[data.id]
              ?.reviewCount || 0,
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
          Math.ceil(
            count / pageLimit
          ),
        limit: pageLimit,
      },
    });

  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: {
        id,
        status: "active",
      },

      include: [
        {
          model: Category,
          as: "category",

          where: {
            status: "active",
          },

          attributes: [
            "id",
            "name",
            "slug",
          ],

          required: true,
        },

        {
          model: ProductImage,
          as: "images",

          attributes: [
            "id",
            "imageUrl",
            "sortOrder",
            "isPrimary",
          ],

          required: false,
        },
      ],

      order: [
        [
          {
            model: ProductImage,
            as: "images",
          },
          "sortOrder",
          "ASC",
        ],
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong",
    });
  }
};

const getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const images = await ProductImage.findAll({
      where: { productId },
      order: [["sortOrder", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Get product images error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Add image
const createProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { imageUrl, sortOrder = 0, isPrimary = false } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Only one primary image per product
    if (isPrimary) {
      await ProductImage.update(
        { isPrimary: false },
        {
          where: {
            productId,
          },
        }
      );
    }

    const image = await ProductImage.create({
      productId,
      imageUrl,
      sortOrder,
      isPrimary,
    });

    return res.status(201).json({
      success: true,
      message: "Product image added successfully",
      data: image,
    });
  } catch (error) {
    console.error("Create product image error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Update image
const updateProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ProductImage.findByPk(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Product image not found",
      });
    }

    const { imageUrl, sortOrder, isPrimary } = req.body;

    if (isPrimary === true) {
      await ProductImage.update(
        { isPrimary: false },
        {
          where: {
            productId: image.productId,
          },
        }
      );
    }

    await image.update({
      imageUrl: imageUrl ?? image.imageUrl,
      sortOrder: sortOrder ?? image.sortOrder,
      isPrimary: isPrimary ?? image.isPrimary,
    });

    return res.status(200).json({
      success: true,
      message: "Product image updated successfully",
      data: image,
    });
  } catch (error) {
    console.error("Update product image error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Delete image
const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ProductImage.findByPk(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Product image not found",
      });
    }

    await image.destroy();

    return res.status(200).json({
      success: true,
      message: "Product image deleted successfully",
    });
  } catch (error) {
    console.error("Delete product image error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        {
          name: {
            [Op.like]:
              `%${search}%`,
          },
        },

        {
          sku: {
            [Op.like]:
              `%${search}%`,
          },
        },
      ];
    }

    if (categoryId) {
      where.categoryId =
        categoryId;
    }

    if (
      status === "active" ||
      status === "inactive"
    ) {
      where.status = status;
    }

    const currentPage =
      Math.max(Number(page), 1);

    const pageLimit =
      Math.min(
        Math.max(Number(limit), 1),
        100
      );

    const offset =
      (currentPage - 1) *
      pageLimit;

    const { count, rows } =
      await Product.findAndCountAll({
        where,

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

        limit: pageLimit,
        offset,
        distinct: true,

        order: [
          ["createdAt", "DESC"],
        ],
      });

    return res.status(200).json({
      success: true,
      data: rows,

      pagination: {
        totalItems: count,
        currentPage,
        totalPages:
          Math.ceil(
            count / pageLimit
          ),
        limit: pageLimit,
      },
    });

  } catch (error) {
    console.error(
      "Admin products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong",
    });
  }
};

const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product =
      await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: [
              "id",
              "name",
              "slug",
              "status",
            ],
          },

          {
            model: ProductImage,
            as: "images",
            attributes: [
              "id",
              "imageUrl",
              "sortOrder",
              "isPrimary",
            ],
            required: false,
          },
        ],

        order: [
          [
            {
              model: ProductImage,
              as: "images",
            },
            "sortOrder",
            "ASC",
          ],
        ],
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(
      "Admin product details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      where: {
        slug,
        status: "active",
      },

      include: [
        {
          model: Category,
          as: "category",

          where: {
            status: "active",
          },

          attributes: [
            "id",
            "name",
            "slug",
          ],

          required: true,
        },

        {
          model: ProductImage,
          as: "images",
          attributes: [
            "id",
            "imageUrl",
            "sortOrder",
            "isPrimary",
          ],
          required: false,
        },
      ],

      order: [
        [
          {
            model: ProductImage,
            as: "images",
          },
          "sortOrder",
          "ASC",
        ],
      ],
    });

    // Check first
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Then get rating
    const ratingMap =
      await getRatingStats([
        product.id,
      ]);

    const data = product.toJSON();

    return res.status(200).json({
      success: true,

      data: {
        ...data,

        averageRating:
          ratingMap[product.id]
            ?.averageRating || 0,

        reviewCount:
          ratingMap[product.id]
            ?.reviewCount || 0,
      },
    });

  } catch (error) {
    console.error(
      "Get product by slug error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;

    const currentProduct = await Product.findByPk(id);

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const products = await Product.findAll({
      where: {
        categoryId: currentProduct.categoryId,
        status: "active",

        id: {
          [Op.ne]: currentProduct.id,
        },
      },

      include: [
        {
          model: Category,
          as: "category",

          where: {
            status: "active",
          },

          attributes: [
            "id",
            "name",
            "slug",
          ],

          required: true,
        },

        {
          model: ProductImage,
          as: "images",

          where: {
            isPrimary: true,
          },

          attributes: [
            "id",
            "imageUrl",
            "isPrimary",
          ],

          required: false,
        },
      ],

      limit: 4,

      order: [
        ["createdAt", "DESC"],
      ],
    });

    const productIds = products.map(
      (product) => product.id
    );

    const ratingMap =
      await getRatingStats(productIds);

    const relatedProducts =
      products.map((product) => {
        const data =
          product.toJSON();

        return {
          ...data,

          averageRating:
            ratingMap[data.id]
              ?.averageRating || 0,

          reviewCount:
            ratingMap[data.id]
              ?.reviewCount || 0,
        };
      });

    return res.status(200).json({
      success: true,
      data: relatedProducts,
    });

  } catch (error) {
    console.error(
      "Get related products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductImages,
  createProductImage,
  updateProductImage,
  deleteProductImage,
  createProduct,
  updateProduct,
  getAdminProducts,
  getAdminProductById,
  getProductBySlug,
  getRelatedProducts,
};