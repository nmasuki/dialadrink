import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductSubCategory {
  _id: string;
  name: string;
  key: string;
  category: string;
  description?: string;
  modifiedDate?: Date;
}

export interface IProductSubCategoryDocument extends Omit<IProductSubCategory, "_id">, Document {}

const ProductSubCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    key: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "ProductCategory" },
    description: { type: String },
    modifiedDate: { type: Date, default: Date.now },
  },
  { collection: "productsubcategories" }
);

const ProductSubCategory: Model<IProductSubCategoryDocument> =
  mongoose.models.ProductSubCategory ||
  mongoose.model("ProductSubCategory", ProductSubCategorySchema);

export default ProductSubCategory;
