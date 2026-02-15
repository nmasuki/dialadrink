import mongoose, { Schema, Document, Model } from "mongoose";
import { IProduct, ICloudinaryImage } from "@/types";

// Cloudinary image sub-schema
const CloudinaryImageSchema = new Schema(
  {
    public_id: String,
    version: Number,
    signature: String,
    width: Number,
    height: Number,
    format: String,
    resource_type: String,
    url: String,
    secure_url: String,
  },
  { _id: false }
);

export interface IProductDocument extends Omit<IProduct, "_id">, Document {}

const ProductSchema = new Schema(
  {
    href: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "KES" },
    alcoholContent: { type: Number },
    countryOfOrigin: { type: String },
    image: CloudinaryImageSchema,
    altImages: [CloudinaryImageSchema],
    category: { type: Schema.Types.ObjectId, ref: "ProductCategory" },
    subCategory: { type: Schema.Types.ObjectId, ref: "ProductSubCategory" },
    brand: { type: Schema.Types.ObjectId, ref: "ProductBrand" },
    priceOptions: [{ type: Schema.Types.ObjectId, ref: "ProductPriceOption" }],
    size: { type: Schema.Types.ObjectId, ref: "Size" },
    taste: { type: Schema.Types.ObjectId, ref: "Taste" },
    grape: { type: Schema.Types.ObjectId, ref: "Grape" },
    tags: [{ type: String }],
    onOffer: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isBrandFocus: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    isGiftPack: { type: Boolean, default: false },
    state: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    youtubeUrl: { type: String },
    pageTitle: { type: String },
    keyWords: { type: String },
    popularity: { type: Number, default: 0 },
    popularityRatio: { type: Number, default: 0 },
    averageRatings: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    publishedDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
  },
  {
    collection: "products", // Match existing collection name
    timestamps: false,
  }
);

// Indexes for search performance
ProductSchema.index({ name: "text", description: "text", tags: "text" });
ProductSchema.index({ state: 1, inStock: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ popularity: -1 });

// Virtual for SEO-friendly URL
ProductSchema.virtual("url").get(function (this: IProductDocument) {
  return `/products/${this.href}`;
});

// Ensure virtuals are included in JSON
ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
