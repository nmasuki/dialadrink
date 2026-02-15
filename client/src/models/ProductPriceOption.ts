import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductPriceOption {
  _id: string;
  optionText: string;
  option?: string;
  product?: string;
  price: number;
  offerPrice?: number;
  currency: string;
  inStock?: boolean;
}

export interface IProductPriceOptionDocument extends Omit<IProductPriceOption, "_id">, Document {}

const ProductPriceOptionSchema = new Schema(
  {
    optionText: { type: String },
    option: { type: Schema.Types.ObjectId, ref: "ProductOption" },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    price: { type: Number, default: 0 },
    offerPrice: { type: Number },
    currency: { type: String, default: "KES" },
    inStock: { type: Boolean, default: true },
  },
  { collection: "productpriceoptions" }
);

// Virtual for percent offer
ProductPriceOptionSchema.virtual("percentOffer").get(function (this: IProductPriceOptionDocument) {
  if (this.offerPrice && this.price > this.offerPrice) {
    const discount = this.price - this.offerPrice;
    return Math.round((100 * discount) / this.price);
  }
  return null;
});

ProductPriceOptionSchema.set("toJSON", { virtuals: true });
ProductPriceOptionSchema.set("toObject", { virtuals: true });

const ProductPriceOption: Model<IProductPriceOptionDocument> =
  mongoose.models.ProductPriceOption ||
  mongoose.model("ProductPriceOption", ProductPriceOptionSchema);

export default ProductPriceOption;
