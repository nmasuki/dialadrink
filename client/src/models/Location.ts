import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILocation {
  _id: string;
  name: string;
  href: string;
  city: string;
  deliveryCharges: number;
  show: boolean;
  location: {
    lat: number;
    lng: number;
  };
}

export interface ILocationDocument extends Omit<ILocation, "_id">, Document {}

const LocationSchema = new Schema<ILocationDocument>(
  {
    name: { type: String, required: true },
    href: { type: String },
    city: { type: String, default: "Nairobi" },
    deliveryCharges: { type: Number, default: 200 },
    show: { type: Boolean, default: true },
    location: {
      lat: Number,
      lng: Number,
    },
  },
  { collection: "locations" }
);

const Location: Model<ILocationDocument> =
  mongoose.models.Location ||
  mongoose.model<ILocationDocument>("Location", LocationSchema);

export default Location;
