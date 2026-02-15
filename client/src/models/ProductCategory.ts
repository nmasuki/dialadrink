import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductCategory {
  _id: string;
  name: string;
  key: string;
  href: string;
  state: string;
  description: string;
  pageTitle: string;
  modifiedDate: Date;
}

export interface IProductCategoryDocument extends Omit<IProductCategory, "_id">, Document {}

const ProductCategorySchema = new Schema<IProductCategoryDocument>(
  {
    name: { type: String, required: true },
    key: { type: String },
    href: { type: String },
    state: { type: String, default: "published" },
    description: { type: String },
    pageTitle: { type: String },
    modifiedDate: { type: Date },
  },
  { collection: "productcategories" }
);

const ProductCategory: Model<IProductCategoryDocument> =
  mongoose.models.ProductCategory || 
  mongoose.model<IProductCategoryDocument>("ProductCategory", ProductCategorySchema);

export default ProductCategory;
