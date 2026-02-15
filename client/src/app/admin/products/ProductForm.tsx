"use client";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  TextField,
  NumberField,
  SelectField,
  CheckboxField,
  TagsField,
} from "@/components/admin/FormFields";
import { RichTextField } from "@/components/admin/RichTextField";
import ImageUpload from "@/components/admin/ImageUpload";
import PriceOptionsEditor from "@/components/admin/PriceOptionsEditor";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { useState } from "react";

interface CloudinaryImage {
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

interface PriceOption {
  _id?: string;
  optionText: string;
  price: number;
  offerPrice?: number;
  currency: string;
  inStock: boolean;
}

interface ProductData {
  _id?: string;
  name: string;
  href: string;
  description: string;
  price: number;
  currency: string;
  state: string;
  category: string;
  subCategory: string;
  brand: string;
  alcoholContent: number | string;
  countryOfOrigin: string;
  image?: CloudinaryImage | null;
  altImages?: CloudinaryImage[];
  priceOptions?: PriceOption[];
  tags: string[];
  onOffer: boolean;
  isPopular: boolean;
  isBrandFocus: boolean;
  inStock: boolean;
  isGiftPack: boolean;
  youtubeUrl: string;
  pageTitle: string;
  keyWords: string;
}

interface CategoryOption {
  _id: string;
  name: string;
}

interface SubCategoryOption {
  _id: string;
  name: string;
  category: string | { _id: string };
}

interface ProductFormProps {
  product?: ProductData;
  categories: CategoryOption[];
  subCategories: SubCategoryOption[];
  brands: CategoryOption[];
}

export default function ProductForm({
  product,
  categories,
  subCategories,
  brands,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product?._id;

  const [priceOptions, setPriceOptions] = useState<PriceOption[]>(
    product?.priceOptions || []
  );
  const [altImages, setAltImages] = useState<CloudinaryImage[]>(
    product?.altImages || []
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProductData>({
    defaultValues: {
      name: product?.name || "",
      href: product?.href || "",
      description: product?.description || "",
      price: product?.price || 0,
      currency: product?.currency || "KES",
      state: product?.state || "published",
      category: typeof product?.category === "string" ? product.category : (product?.category as unknown as CategoryOption)?._id || "",
      subCategory: typeof product?.subCategory === "string" ? product.subCategory : (product?.subCategory as unknown as SubCategoryOption)?._id || "",
      brand: typeof product?.brand === "string" ? product.brand : (product?.brand as unknown as CategoryOption)?._id || "",
      alcoholContent: product?.alcoholContent || "",
      countryOfOrigin: product?.countryOfOrigin || "",
      image: product?.image || null,
      tags: product?.tags || [],
      onOffer: product?.onOffer || false,
      isPopular: product?.isPopular || false,
      isBrandFocus: product?.isBrandFocus || false,
      inStock: product?.inStock !== false,
      isGiftPack: product?.isGiftPack || false,
      youtubeUrl: product?.youtubeUrl || "",
      pageTitle: product?.pageTitle || "",
      keyWords: product?.keyWords || "",
    },
  });

  const nameValue = watch("name");
  const selectedCategory = watch("category");

  const generateSlug = () => {
    const slug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("href", slug);
  };

  // Filter subcategories by selected category
  const filteredSubCategories = subCategories.filter((sc) => {
    const catId = typeof sc.category === "string" ? sc.category : sc.category?._id;
    return catId === selectedCategory;
  });

  const onSubmit = async (data: ProductData) => {
    try {
      const payload = {
        ...data,
        altImages,
        alcoholContent: data.alcoholContent ? Number(data.alcoholContent) : undefined,
        price: Number(data.price) || 0,
        // Don't send priceOptions in main payload — they're managed separately
      };

      if (isEdit) {
        await axios.put(`/api/admin/products/${product._id}`, payload);
        toast.success("Product updated");
      } else {
        const res = await axios.post("/api/admin/products", payload);
        toast.success("Product created");
        // If we have unsaved price options, save them now
        if (priceOptions.length > 0 && res.data.data?._id) {
          for (const opt of priceOptions) {
            if (!opt._id) {
              await axios.post("/api/admin/price-options", {
                productId: res.data.data._id,
                ...opt,
              });
            }
          }
        }
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error(isEdit ? "Failed to update product" : "Failed to create product");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-gray-500 hover:text-teal flex items-center gap-1"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Basic Info</h2>

            <TextField
              label="Name"
              required
              registration={register("name", { required: "Name is required" })}
              error={errors.name?.message}
            />

            <div>
              <TextField
                label="Slug (href)"
                required
                registration={register("href", { required: "Slug is required" })}
                error={errors.href?.message}
                helper="URL-friendly identifier"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="mt-1 text-xs text-teal hover:underline"
              >
                Generate from name
              </button>
            </div>

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextField
                  label="Description"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <SelectField
              label="State"
              registration={register("state")}
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Pricing</h2>

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Base Price"
                registration={register("price", { valueAsNumber: true })}
                min={0}
                step={1}
                helper="Used when no price options exist"
              />
              <SelectField
                label="Currency"
                registration={register("currency")}
                options={[
                  { value: "KES", label: "KES" },
                  { value: "USD", label: "USD" },
                ]}
              />
            </div>

            <div className="border-t pt-4">
              <PriceOptionsEditor
                productId={product?._id}
                value={priceOptions}
                onChange={setPriceOptions}
              />
            </div>
          </div>

          {/* Classification */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Classification</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField
                label="Category"
                registration={register("category")}
                placeholder="Select category"
                options={categories.map((c) => ({ value: c._id, label: c.name }))}
              />
              <SelectField
                label="Sub Category"
                registration={register("subCategory")}
                placeholder="Select sub category"
                options={filteredSubCategories.map((sc) => ({
                  value: sc._id,
                  label: sc.name,
                }))}
              />
              <SelectField
                label="Brand"
                registration={register("brand")}
                placeholder="Select brand"
                options={brands.map((b) => ({ value: b._id, label: b.name }))}
              />
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Alcohol Content (%)"
                registration={register("alcoholContent")}
                min={0}
                max={100}
                step={0.1}
              />
              <TextField
                label="Country of Origin"
                registration={register("countryOfOrigin")}
                placeholder="e.g. Scotland"
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Images</h2>

            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="products"
                  label="Main Image"
                />
              )}
            />

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {altImages.map((img, i) => (
                  <ImageUpload
                    key={img.public_id}
                    value={img}
                    onChange={(newImg) => {
                      if (newImg) {
                        const updated = [...altImages];
                        updated[i] = newImg;
                        setAltImages(updated);
                      } else {
                        setAltImages(altImages.filter((_, idx) => idx !== i));
                      }
                    }}
                    folder="products"
                    label=""
                  />
                ))}
                <ImageUpload
                  value={null}
                  onChange={(img) => {
                    if (img) setAltImages([...altImages, img]);
                  }}
                  folder="products"
                  label=""
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">SEO</h2>

            <TextField
              label="Page Title"
              registration={register("pageTitle")}
              placeholder="Custom page title for SEO"
            />
            <TextField
              label="Keywords"
              registration={register("keyWords")}
              placeholder="Comma-separated keywords"
            />
            <TextField
              label="YouTube URL"
              registration={register("youtubeUrl")}
              type="url"
              placeholder="https://youtube.com/..."
            />

            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagsField
                  label="Tags"
                  value={field.value || []}
                  onChange={field.onChange}
                  helper="Press Enter or comma to add"
                />
              )}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Flags */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Flags</h2>

            <CheckboxField label="In Stock" registration={register("inStock")} />
            <CheckboxField label="On Offer" registration={register("onOffer")} />
            <CheckboxField label="Popular" registration={register("isPopular")} />
            <CheckboxField label="Brand Focus" registration={register("isBrandFocus")} />
            <CheckboxField label="Gift Pack" registration={register("isGiftPack")} />
          </div>

          {/* Save Button */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-teal text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              {isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </button>
            <Link
              href="/admin/products"
              className="mt-3 w-full block text-center px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
