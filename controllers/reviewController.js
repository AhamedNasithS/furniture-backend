const { fn, col } = require("sequelize");

const {
  Review,
  User,
  Product,
  Order,
  OrderItem,
} = require("../models");


// PUBLIC - GET PRODUCT REVIEWS
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const reviews = await Review.findAll({
      where: { productId },

      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    const summary = await Review.findOne({
      where: { productId },

      attributes: [
        [
          fn("AVG", col("rating")),
          "averageRating",
        ],
        [
          fn("COUNT", col("id")),
          "reviewCount",
        ],
      ],

      raw: true,
    });

    return res.status(200).json({
      success: true,

      data: {
        averageRating:
          Number(
            Number(
              summary.averageRating || 0
            ).toFixed(1)
          ),

        reviewCount:
          Number(summary.reviewCount) || 0,

        reviews,
      },
    });

  } catch (error) {
    console.error(
      "Get reviews error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// CUSTOMER - CREATE REVIEW
const createReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const {
      rating,
      comment,
    } = req.body;

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rating must be between 1 and 5",
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

    // Only customers who received this product
    // can review it.
    const deliveredOrder =
      await Order.findOne({
        where: {
          userId,
          status: "delivered",
        },

        include: [
          {
            model: OrderItem,
            as: "items",

            where: {
              productId,
            },

            required: true,
          },
        ],
      });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message:
          "You can review this product only after it has been delivered",
      });
    }

    const existing =
      await Review.findOne({
        where: {
          userId,
          productId,
        },
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "You already reviewed this product",
      });
    }

    const review = await Review.create({
      userId,
      productId,
      rating: numericRating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message:
        "Review added successfully",
      data: review,
    });

  } catch (error) {
    console.error(
      "Create review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// UPDATE OWN REVIEW
const updateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const review = await Review.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const {
      rating,
      comment,
    } = req.body;

    if (rating !== undefined) {
      const numericRating =
        Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 1 and 5",
        });
      }

      review.rating =
        numericRating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    return res.status(200).json({
      success: true,
      message:
        "Review updated successfully",
      data: review,
    });

  } catch (error) {
    console.error(
      "Update review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// DELETE OWN REVIEW
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const review = await Review.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await review.destroy();

    return res.status(200).json({
      success: true,
      message:
        "Review deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};