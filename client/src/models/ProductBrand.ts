import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductBrand {
  _id: string;
  name: string;
  href: string;
  state: string;
}

export interface IProductBrandDocument extends Omit<IProductBrand, "_id">, Document {}

const ProductBrandSchema = new Schema<IProductBrandDocument>(
  {
    name: { type: String, required: true },
    href: { type: String },
    state: { type: String, default: "published" },
  },
  { collection: "productbrands" }
);

const ProductBrand: Model<IProductBrandDocument> =
  mongoose.models.ProductBrand || 
  mongoose.model<IProductBrandDocument>("ProductBrand", ProductBrandSchema);

export default ProductBrand;
