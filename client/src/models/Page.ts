import mongoose, { Schema, Document, Model } from "mongoose";

interface ICloudinaryImage {
  public_id?: string;
  secure_url?: string;
  url?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface IPage {
  _id: string;
  key: string;
  href: string;
  name: string;
  title: string;
  meta: string;
  h1: string;
  h1s: string[];
  content: string;
  breafContent: string;
  bannerImages: ICloudinaryImage[];
  mobileBannerImages: ICloudinaryImage[];
  state: string;
}

export interface IPageDocument extends Omit<IPage, "_id">, Document {}

const CloudinaryImageSchema = new Schema(
  {
    public_id: String,
    secure_url: String,
    url: String,
    width: Number,
    height: Number,
    format: String,
    version: Number,
    signature: String,
    resource_type: String,
  },
  { _id: true }
);

const PageSchema = new Schema(
  {
    key: { type: String },
    href: { type: String },
    name: { type: String },
    title: { type: String },
    meta: { type: String },
    h1: { type: String },
    h1s: [{ type: String }],
    content: { type: String },
    breafContent: { type: String },
    bannerImages: [CloudinaryImageSchema],
    mobileBannerImages: [CloudinaryImageSchema],
    state: { type: String, default: "published" },
  },
  { collection: "pages" }
);

const Page: Model<IPageDocument> =
  mongoose.models.Page || mongoose.model("Page", PageSchema);

export default Page;
