import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMenuItem {
  _id: string;
  href: string;
  label: string;
  index: number;
  level: number;
  show: boolean;
  type: string;
  parent?: string;
  submenus?: IMenuItem[];
}

export interface IMenuItemDocument extends Omit<IMenuItem, "_id" | "submenus">, Document {
  submenus?: mongoose.Types.ObjectId[];
}

const MenuItemSchema = new Schema(
  {
    href: { type: String },
    label: { type: String },
    index: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    show: { type: Boolean, default: true },
    type: { type: String, default: "top" },
    parent: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    submenus: [{ type: Schema.Types.ObjectId, ref: "MenuItem" }],
  },
  { collection: "menuitems" }
);

const MenuItem: Model<IMenuItemDocument> =
  mongoose.models.MenuItem ||
  mongoose.model("MenuItem", MenuItemSchema);

export default MenuItem;
