const sequelize = require("../dbConfig");

const {
  Wishlist,
  Product,
  ProductImage,
  Cart,
  CartItem,
  Category,
} = require("../models");

// GET USER WISHLIST
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const wishlist = await Wishlist.findAll({
      where: { userId },

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
                "sortOrder",
                "isPrimary",
              ],
            },
          ],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// ADD PRODUCT TO WISHLIST
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findOne({
      where: {
        id: productId,
        status: "active",
      },

      include: [
        {
          model: Category,
          as: "category",

          where: {
            status: "active",
          },

          required: true,
        },
      ],
    });

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    const existing = await Wishlist.findOne({
      where: {
        userId,
        productId,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    const wishlistItem = await Wishlist.create({
      userId,
      productId,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      data: wishlistItem,
    });
  } catch (error) {
    console.error("Add wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// REMOVE PRODUCT FROM WISHLIST
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      where: {
        userId,
        productId,
      },
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    await wishlistItem.destroy();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const moveToCart = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Check wishlist
    const wishlistItem = await Wishlist.findOne({
      where: {
        userId,
        productId,
      },
      transaction,
    });

    if (!wishlistItem) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    // Check product
    const product = await Product.findOne({
      where: {
        id: productId,
        status: "active",
      },

      include: [
        {
          model: Category,
          as: "category",

          where: {
            status: "active",
          },

          required: true,
        },
      ],

      transaction,
    });

    if (!product) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({
      where: { userId },
      transaction,
    });

    if (!cart) {
      cart = await Cart.create(
        { userId },
        { transaction }
      );
    }

    // Check if product already exists in cart
    let cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
      },
      transaction,
    });

    const finalQuantity = cartItem
      ? cartItem.quantity + requestedQuantity
      : requestedQuantity;

    if (finalQuantity > product.stock) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    if (cartItem) {
      cartItem.quantity = finalQuantity;

      await cartItem.save({
        transaction,
      });
    } else {
      cartItem = await CartItem.create(
        {
          cartId: cart.id,
          productId,
          quantity: requestedQuantity,
        },
        { transaction }
      );
    }

    // Remove from wishlist only after cart succeeds
    await wishlistItem.destroy({
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Product moved to cart successfully",
      data: cartItem,
    });

  } catch (error) {
    await transaction.rollback();

    console.error(
      "Move wishlist to cart error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
};