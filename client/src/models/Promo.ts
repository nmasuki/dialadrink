import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPromo {
  _id: string;
  name: string;
  code: string;
  key: string;
  discount: number;
  discountType: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IPromoDocument extends Omit<IPromo, "_id">, Document {}

const PromoSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    key: { type: String },
    discount: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { collection: "promos" }
);

const Promo: Model<IPromoDocument> =
  mongoose.models.Promo ||
  mongoose.model("Promo", PromoSchema);

export default Promo;
