"use client";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { TextField, SelectField } from "@/components/admin/FormFields";
import { RichTextField } from "@/components/admin/RichTextField";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";

interface CategoryData {
  _id?: string;
  name: string;
  key: string;
  href: string;
  state: string;
  description: string;
  pageTitle: string;
  modifiedDate?: string;
}

interface CategoryFormProps {
  category?: CategoryData;
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const isEdit = !!category?._id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CategoryData>({
    defaultValues: {
      name: category?.name || "",
      key: category?.key || "",
      href: category?.href || "",
      state: category?.state || "published",
      description: category?.description || "",
      pageTitle: category?.pageTitle || "",
    },
  });

  const nameValue = watch("name");

  const generateKey = () => {
    const key = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("key", key);
  };

  const onSubmit = async (data: CategoryData) => {
    try {
      const payload = { ...data, modifiedDate: new Date().toISOString() };
      if (isEdit) {
        await axios.put(`/api/admin/categories/${category._id}`, payload);
        toast.success("Category updated");
      } else {
        await axios.post("/api/admin/categories", payload);
        toast.success("Category created");
      }
      router.push("/admin/categories");
      router.refresh();
    } catch {
      toast.error(isEdit ? "Failed to update category" : "Failed to create category");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/categories" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" /> Back to Categories
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <TextField
          label="Name"
          required
          registration={register("name", { required: "Name is required" })}
          error={errors.name?.message}
        />

        <div>
          <TextField
            label="Key"
            registration={register("key")}
            error={errors.key?.message}
            helper="URL-friendly identifier"
          />
          <button
            type="button"
            onClick={generateKey}
            className="mt-1 text-xs text-teal hover:underline"
          >
            Generate from name
          </button>
        </div>

        <TextField
          label="Slug (href)"
          registration={register("href")}
          error={errors.href?.message}
          helper="URL path for this category"
        />

        <SelectField
          label="State"
          registration={register("state")}
          options={[
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />

        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <RichTextField
              label="Description"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <TextField
          label="Page Title"
          registration={register("pageTitle")}
          error={errors.pageTitle?.message}
          helper="SEO title for the category page"
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {isSubmitting ? "Saving..." : isEdit ? "Update Category" : "Create Category"}
        </button>
        <Link
          href="/admin/categories"
          className="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
