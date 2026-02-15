import mongoose, { Schema, Document, Model } from "mongoose";
import { ICategory, ICloudinaryImage } from "@/types";

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

export interface ICategoryDocument extends Omit<ICategory, "_id">, Document {}

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    image: CloudinaryImageSchema,
    pageTitle: { type: String },
    modifiedDate: { type: Date, default: Date.now },
  },
  {
    collection: "productcategories",
    timestamps: false,
  }
);

const Category: Model<ICategoryDocument> =
  mongoose.models.ProductCategory ||
  mongoose.model("ProductCategory", CategorySchema);

export default Category;
