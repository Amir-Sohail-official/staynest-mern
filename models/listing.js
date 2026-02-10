const mongoose = require("mongoose");
const Review = require("./review.js");

const Schema = mongoose.Schema;

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,

    image: {
      url: String,
      filename: String,
    },

    price: {
      type: Number,
      min: 0,
    },

    location: String,
    country: String,

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      enum: [
        "trending",
        "homes",
        "iconic cities",
        "mountains",
        "castles",
        "amazing pools",
        "camping",
        "farms",
        "arctic",
      ],
      required: true,
    },
  },
  { timestamps: true },
);

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

module.exports = mongoose.model("Listing", listingSchema);
