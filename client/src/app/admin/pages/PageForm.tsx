"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { TextField, TextAreaField, SelectField } from "@/components/admin/FormFields";
import { RichTextField } from "@/components/admin/RichTextField";
import ImageUpload from "@/components/admin/ImageUpload";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave, FiPlus } from "react-icons/fi";

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

interface PageData {
  _id?: string;
  name: string;
  key: string;
  href: string;
  title: string;
  meta: string;
  h1: string;
  content: string;
  breafContent: string;
  state: string;
  bannerImages?: CloudinaryImage[];
  mobileBannerImages?: CloudinaryImage[];
}

interface PageFormProps {
  page?: PageData;
}

export default function PageForm({ page }: PageFormProps) {
  const router = useRouter();
  const isEdit = !!page?._id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PageData>({
    defaultValues: {
      name: page?.name || "",
      key: page?.key || "",
      href: page?.href || "",
      title: page?.title || "",
      meta: page?.meta || "",
      h1: page?.h1 || "",
      content: page?.content || "",
      breafContent: page?.breafContent || "",
      state: page?.state || "published",
    },
  });

  const [bannerImages, setBannerImages] = useState<(CloudinaryImage | null)[]>(page?.bannerImages || []);
  const [mobileBannerImages, setMobileBannerImages] = useState<(CloudinaryImage | null)[]>(page?.mobileBannerImages || []);

  const nameValue = watch("name");

  const generateSlug = () => {
    const slug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("key", slug);
    setValue("href", `/${slug}`);
  };

  const onSubmit = async (data: PageData) => {
    try {
      const payload = {
        ...data,
        bannerImages: bannerImages.filter(Boolean),
        mobileBannerImages: mobileBannerImages.filter(Boolean),
      };
      if (isEdit) {
        await axios.put(`/api/admin/pages/${page._id}`, payload);
        toast.success("Page updated");
      } else {
        await axios.post("/api/admin/pages", payload);
        toast.success("Page created");
      }
      router.push("/admin/pages");
      router.refresh();
    } catch {
      toast.error(isEdit ? "Failed to update page" : "Failed to create page");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/pages" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" /> Back to Pages
        </Link>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Basic Info</h2>

        <TextField
          label="Page Name"
          required
          registration={register("name", { required: "Name is required" })}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <TextField
              label="Key"
              registration={register("key")}
              helper="Identifier (e.g. category-whisky)"
            />
          </div>
          <div>
            <TextField
              label="Href (URL path)"
              registration={register("href")}
              helper="e.g. /contact-us, category/whisky"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={generateSlug}
          className="text-xs text-teal hover:underline"
        >
          Generate key & href from name
        </button>

        <SelectField
          label="State"
          registration={register("state")}
          options={[
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />
      </div>

      {/* SEO Fields */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">SEO</h2>

        <TextField
          label="SEO Title"
          registration={register("title")}
          helper="Browser tab title"
        />

        <TextAreaField
          label="Meta Description"
          registration={register("meta")}
          helper="Search engine description (150-160 chars recommended)"
        />

        <TextField
          label="H1 Heading"
          registration={register("h1")}
          helper="Main visible heading on the page"
        />
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Content</h2>

        <Controller
          name="breafContent"
          control={control}
          render={({ field }) => (
            <RichTextField
              label="Brief Content (Intro)"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <RichTextField
              label="Full Content"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Banner Images */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Banner Images (Desktop)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bannerImages.map((img, i) => (
            <div key={img?.public_id || `banner-${i}`}>
              <ImageUpload
                value={img}
                onChange={(newImg) => {
                  if (newImg) {
                    const updated = [...bannerImages];
                    updated[i] = newImg;
                    setBannerImages(updated);
                  } else {
                    setBannerImages(bannerImages.filter((_, idx) => idx !== i));
                  }
                }}
                folder="pages"
                label={`Banner ${i + 1}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setBannerImages([...bannerImages, null])}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-400 hover:border-teal hover:text-teal transition-colors"
          >
            <FiPlus className="w-6 h-6 mb-1" />
            <span className="text-sm">Add Banner</span>
          </button>
        </div>
      </div>

      {/* Mobile Banner Images */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Banner Images (Mobile)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mobileBannerImages.map((img, i) => (
            <div key={img?.public_id || `mobile-${i}`}>
              <ImageUpload
                value={img}
                onChange={(newImg) => {
                  if (newImg) {
                    const updated = [...mobileBannerImages];
                    updated[i] = newImg;
                    setMobileBannerImages(updated);
                  } else {
                    setMobileBannerImages(mobileBannerImages.filter((_, idx) => idx !== i));
                  }
                }}
                folder="pages"
                label={`Mobile Banner ${i + 1}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMobileBannerImages([...mobileBannerImages, null])}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-400 hover:border-teal hover:text-teal transition-colors"
          >
            <FiPlus className="w-6 h-6 mb-1" />
            <span className="text-sm">Add Mobile Banner</span>
          </button>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {isSubmitting ? "Saving..." : isEdit ? "Update Page" : "Create Page"}
        </button>
        <Link
          href="/admin/pages"
          className="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
