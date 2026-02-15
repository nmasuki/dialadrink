import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderDelivery {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address: string;
  building?: string;
  houseNumber?: string;
  location?: string;
}

export interface IOrderItem {
  product?: string;
  name: string;
  quantity: string;
  pieces: number;
  price: number;
  currency: string;
}

export interface IOrder {
  _id: string;
  key: string;
  orderNumber: number;
  delivery: IOrderDelivery;
  items: IOrderItem[];
  state: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  payment: {
    state: string;
    transactionId?: string;
    referenceId?: string;
    method?: string;
  };
  notes?: string;
  orderDate: Date;
  modifiedDate: Date;
}

export interface IOrderDocument extends Omit<IOrder, "_id">, Document {}

const OrderSchema = new Schema<IOrderDocument>(
  {
    key: { type: String, required: true, unique: true },
    orderNumber: { type: Number, required: true },
    delivery: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      email: { type: String },
      address: { type: String, required: true },
      building: { type: String },
      houseNumber: { type: String },
      location: { type: String },
    },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: false },
        name: { type: String, required: true },
        quantity: String,
        pieces: Number,
        price: Number,
        currency: { type: String, default: "KES" },
      },
    ],
    state: {
      type: String,
      enum: ["placed", "confirmed", "preparing", "dispatched", "delivered", "cancelled", "paid"],
      default: "placed",
    },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "card", "mpesa_delivery", "swipe_delivery", "pesapal"],
      default: "cash",
    },
    payment: {
      state: { type: String, default: "Pending" },
      transactionId: String,
      referenceId: String,
      method: String,
    },
    notes: { type: String },
    orderDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
  },
  { collection: "orders" }
);

// Update modified date on save
OrderSchema.pre("save", function (next) {
  this.modifiedDate = new Date();
  next();
});

const Order: Model<IOrderDocument> =
  mongoose.models.Order ||
  mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;
