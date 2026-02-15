import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppUser {
  _id: string;
  name: { first: string; last: string };
  email: string;
  password: string;
  phoneNumber?: string;
  accountStatus: string;
  accountType: string;
  receivesOrders: boolean;
}

export interface IAppUserDocument extends Omit<IAppUser, "_id">, Document {}

const AppUserSchema = new Schema<IAppUserDocument>(
  {
    name: {
      first: { type: String },
      last: { type: String },
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    accountStatus: { type: String, default: "Active" },
    accountType: { type: String },
    receivesOrders: { type: Boolean, default: false },
  },
  { collection: "appusers" }
);

const AppUser: Model<IAppUserDocument> =
  mongoose.models.AppUser ||
  mongoose.model<IAppUserDocument>("AppUser", AppUserSchema);

export default AppUser;
