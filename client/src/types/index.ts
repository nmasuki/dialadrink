// Product Types
export interface IProduct {
  _id: string;
  href: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  alcoholContent?: number;
  countryOfOrigin?: string;
  image?: ICloudinaryImage;
  altImages?: ICloudinaryImage[];
  category?: ICategory | string;
  subCategory?: ISubCategory | string;
  brand?: IBrand | string;
  priceOptions?: IPriceOption[];
  size?: ISize | string;
  taste?: ITaste | string;
  grape?: IGrape | string;
  tags?: string[];
  onOffer?: boolean;
  isPopular?: boolean;
  isBrandFocus?: boolean;
  inStock?: boolean;
  isGiftPack?: boolean;
  state: "draft" | "published" | "archived";
  youtubeUrl?: string;
  pageTitle?: string;
  keyWords?: string;
  popularity?: number;
  popularityRatio?: number;
  averageRatings?: number;
  ratingCount?: number;
  publishedDate?: Date;
  modifiedDate?: Date;
}

export interface ICloudinaryImage {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  url: string;
  secure_url: string;
}

export interface ICategory {
  _id: string;
  name: string;
  key: string;
  description?: string;
  image?: ICloudinaryImage;
  pageTitle?: string;
  modifiedDate?: Date;
}

export interface ISubCategory {
  _id: string;
  name: string;
  key: string;
  category: ICategory | string;
  description?: string;
  modifiedDate?: Date;
}

export interface IBrand {
  _id: string;
  name: string;
  href: string;
  description?: string;
  image?: ICloudinaryImage;
  company?: string;
  modifiedDate?: Date;
}

export interface IPriceOption {
  _id: string;
  optionText?: string;
  option?: string;
  quantity?: string;
  price: number;
  offerPrice?: number;
  currency: string;
  inStock?: boolean;
  percentOffer?: number;
  product?: string;
}


export interface ISize {
  _id: string;
  name: string;
}

export interface ITaste {
  _id: string;
  name: string;
}

export interface IGrape {
  _id: string;
  name: string;
}

// Cart Types
export interface ICartItem {
  _id: string;
  product: IProduct | string;
  quantity: string;
  pieces: number;
  price: number;
  currency: string;
}

export interface ICart {
  items: ICartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promo?: IPromo;
}

export interface IPromo {
  _id: string;
  code: string;
  name: string;
  discount: number;
  discountType: "percent" | "percentage" | "fixed";
  isRunning: boolean;
}

// Order Types
export interface IOrder {
  _id: string;
  orderNumber: string;
  orderDate: Date;
  state: "created" | "placed" | "dispatched" | "delivered" | "cancelled" | "pending" | "paid";
  cart: ICartItem[];
  delivery: IDeliveryInfo;
  payment: IPaymentInfo;
  promo?: IPromo;
  subtotal: number;
  deliveryCharges: number;
  discount: number;
  total: number;
  modifiedDate?: Date;
}

export interface IDeliveryInfo {
  firstName: string;
  lastName?: string;
  email?: string;
  phoneNumber: string;
  location?: string;
  street?: string;
  building?: string;
  houseno?: string;
  clientIp?: string;
}

export interface IPaymentInfo {
  method: "M-Pesa" | "PesaPal" | "CyberSource" | "Swipe" | "Cash";
  state: "Pending" | "SUBMITTED" | "Paid" | "Cancelled";
  amount: number;
  referenceId?: string;
  transactionId?: string;
}

// User Types
export interface IUser {
  _id: string;
  email?: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  gender?: "M" | "F";
  savedAddresses?: IDeliveryInfo[];
  createdAt?: Date;
}

// Location Types
export interface ILocation {
  _id: string;
  name: string;
  key: string;
  deliveryCharges: number;
  freeDeliveryThreshold: number;
  isActive: boolean;
  viewport?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

// Admin Types
export interface IAppUser {
  _id: string;
  name: { first: string; last: string };
  email: string;
  phoneNumber?: string;
  accountStatus: string;
  accountType: string;
  receivesOrders: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  response: "success" | "error";
  data?: T;
  message?: string;
  count?: number;
  page?: number;
  totalPages?: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  query?: string;
}
