const {
  Cart,
  CartItem,
  Product,
  ProductImage,
  StoreSetting,
  Category,
} = require("../models");

// GET CART
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({
      where: { userId },

      include: [
        {
          model: CartItem,
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
                    "sortOrder",
                    "isPrimary",
                  ],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart) {
      cart = await Cart.create({
        userId,
      });
    }

    const settings =
      await StoreSetting.findByPk(1);

    const configuredShippingFee =
      Number(settings?.shippingFee) || 0;

    const freeShippingThreshold =
      settings?.freeShippingThreshold !== null &&
        settings?.freeShippingThreshold !== undefined
        ? Number(settings.freeShippingThreshold)
        : null;

    let subtotal = 0;
    let totalItems = 0;

    const items = (cart.items || []).map(
      (item) => {
        const product =
          item.product;

        if (!product) {
          return item.toJSON();
        }

        const regularPrice =
          Number(product.price);

        const sellingPrice =
          product.discountPrice !== null
            ? Number(
              product.discountPrice
            )
            : regularPrice;

        const itemTotal =
          sellingPrice *
          item.quantity;

        subtotal += itemTotal;

        totalItems +=
          item.quantity;

        return {
          ...item.toJSON(),

          unitPrice:
            sellingPrice,

          itemTotal,
        };
      }
    );

    let shippingFee =
      items.length > 0
        ? configuredShippingFee
        : 0;

    if (
      freeShippingThreshold !== null &&
      subtotal >=
      freeShippingThreshold
    ) {
      shippingFee = 0;
    }

    const totalAmount =
      subtotal + shippingFee;

    const amountForFreeShipping =
      freeShippingThreshold !== null &&
        subtotal <
        freeShippingThreshold
        ? freeShippingThreshold -
        subtotal
        : 0;

    return res.status(200).json({
      success: true,

      data: {
        id: cart.id,
        userId: cart.userId,
        items,

        summary: {
          totalItems,

          subtotal:
            Number(
              subtotal.toFixed(2)
            ),

          shippingFee:
            Number(
              shippingFee.toFixed(2)
            ),

          totalAmount:
            Number(
              totalAmount.toFixed(2)
            ),

          freeShippingThreshold,

          amountForFreeShipping:
            Number(
              amountForFreeShipping.toFixed(
                2
              )
            ),

          currency:
            settings?.currency ||
            "INR",
        },
      },
    });

  } catch (error) {
    console.error(
      "Get cart error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong",
    });
  }
};


// ADD TO CART
const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
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

    let cart = await Cart.findOne({
      where: { userId },
    });

    if (!cart) {
      cart = await Cart.create({ userId });
    }

    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    const requestedQuantity =
      existingItem
        ? existingItem.quantity + Number(quantity)
        : Number(quantity);

    if (requestedQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedQuantity;

      await existingItem.save();

      return res.status(200).json({
        success: true,
        message: "Cart quantity updated",
        data: existingItem,
      });
    }

    const cartItem = await CartItem.create({
      cartId: cart.id,
      productId,
      quantity: Number(quantity),
    });

    return res.status(201).json({
      success: true,
      message: "Product added to cart",
      data: cartItem,
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// UPDATE QUANTITY
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const cart = await Cart.findOne({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
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

    if (Number(quantity) > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    item.quantity = Number(quantity);
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Update cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// REMOVE ITEM
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const cart = await Cart.findOne({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    await item.destroy();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error("Remove cart item error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};