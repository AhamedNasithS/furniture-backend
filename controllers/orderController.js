const sequelize = require("../dbConfig");

const {
  Address,
  Cart,
  CartItem,
  Product,
  ProductImage,
  Order,
  OrderItem,
  StoreSetting,
  Category,
} = require("../models");


// CREATE ORDER / CHECKOUT
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.userId;

    const {
      addressId,
      paymentMethod = "cod",
    } = req.body;

    if (!addressId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    // 1. Check address belongs to logged-in user
    const address = await Address.findOne({
      where: {
        id: addressId,
        userId,
      },
      transaction,
    });

    if (!address) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // 2. Get cart + products
    const cart = await Cart.findOne({
      where: { userId },

      include: [
        {
          model: CartItem,
          as: "items",

          include: [
            {
              model: Product,
              as: "product",

              where: {
                status: "active",
              },

              required: false,

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
            },
          ],
        },
      ],

      transaction,
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let subtotal = 0;

    // 3. Validate products + stock
    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists",
        });
      }

      if (product.status !== "active") {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: `${product.name} is not available`,
        });
      }

      if (item.quantity > product.stock) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}`,
        });
      }

      const sellingPrice =
        product.discountPrice !== null
          ? Number(product.discountPrice)
          : Number(product.price);

      subtotal +=
        sellingPrice *
        item.quantity;
    }

    const [settings] = await StoreSetting.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        storeName: "FTC Furniture",
        currency: "INR",
        shippingFee: 0,
        lowStockThreshold: 5,
        orderPrefix: "FTC",
      },
      transaction,
    });

    let shippingFee = Number(settings.shippingFee) || 0;

    const freeShippingThreshold =
      settings.freeShippingThreshold !== null
        ? Number(settings.freeShippingThreshold)
        : null;

    if (
      freeShippingThreshold !== null &&
      subtotal >= freeShippingThreshold
    ) {
      shippingFee = 0;
    }

    const totalAmount = subtotal + shippingFee;

    const orderNumber =
      `${settings.orderPrefix}-${Date.now()}-${userId}`;

    // 5. Create order
    const order = await Order.create(
      {
        orderNumber,
        userId,

        status: "pending",

        paymentStatus:
          paymentMethod === "cod"
            ? "pending"
            : "pending",

        paymentMethod,

        subtotal,
        shippingFee,
        totalAmount,

        // Snapshot customer's address
        shippingFullName: address.fullName,
        shippingPhone: address.phone,
        shippingAddressLine1: address.addressLine1,
        shippingAddressLine2: address.addressLine2,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: address.country,
      },
      { transaction }
    );

    // 6. Create order items + reduce stock
    for (const item of cart.items) {
      const product = item.product;

      const unitPrice =
        product.discountPrice !== null
          ? Number(product.discountPrice)
          : Number(product.price);

      const itemTotal =
        unitPrice * item.quantity;

      await OrderItem.create(
        {
          orderId: order.id,
          productId: product.id,

          // Snapshot
          productName: product.name,
          unitPrice,

          quantity: item.quantity,
          total: itemTotal,
        },
        { transaction }
      );

      product.stock =
        product.stock - item.quantity;

      await product.save({
        transaction,
      });
    }

    // 7. Clear cart
    await CartItem.destroy({
      where: {
        cartId: cart.id,
      },
      transaction,
    });

    // Everything succeeded
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",

      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
      },
    });

  } catch (error) {
    await transaction.rollback();

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// GET LOGGED-IN USER ORDERS
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await Order.findAll({
      where: { userId },

      include: [
        {
          model: OrderItem,
          as: "items",
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// GET ONE ORDER
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id,
        userId,
      },

      include: [
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
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id,
        userId,
      },

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

    const cancellableStatuses = [
      "pending",
      "confirmed",
    ];

    if (!cancellableStatuses.includes(order.status)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled",
      });
    }

    // Restore stock
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

    order.status = "cancelled";

    // For our simplified payment system
    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
    }

    await order.save({
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",

      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    });

  } catch (error) {
    await transaction.rollback();

    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};