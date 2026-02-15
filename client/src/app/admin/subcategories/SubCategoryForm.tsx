"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { TextField, SelectField, TextAreaField } from "@/components/admin/FormFields";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";

interface SubCategoryData {
  _id?: string;
  name: string;
  key: string;
  category: string;
  description: string;
}

interface SubCategoryFormProps {
  subcategory?: SubCategoryData;
  categories: { _id: string; name: string }[];
}

export default function SubCategoryForm({ subcategory, categories }: SubCategoryFormProps) {
  const router = useRouter();
  const isEdit = !!subcategory?._id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<SubCategoryData>({
    defaultValues: {
      name: subcategory?.name || "",
      key: subcategory?.key || "",
      category: subcategory?.category || "",
      description: subcategory?.description || "",
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

  const onSubmit = async (data: SubCategoryData) => {
    try {
      if (isEdit) {
        await axios.put(`/api/admin/subcategories/${subcategory._id}`, data);
        toast.success("Sub category updated");
      } else {
        await axios.post("/api/admin/subcategories", data);
        toast.success("Sub category created");
      }
      router.push("/admin/subcategories");
      router.refresh();
    } catch {
      toast.error(isEdit ? "Failed to update sub category" : "Failed to create sub category");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/subcategories" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" /> Back to Sub Categories
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

        <SelectField
          label="Category"
          required
          registration={register("category", { required: "Category is required" })}
          error={errors.category?.message}
          placeholder="Select a category"
          options={categories.map((c) => ({ value: c._id, label: c.name }))}
        />

        <TextAreaField
          label="Description"
          registration={register("description")}
          error={errors.description?.message}
          placeholder="Optional description"
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {isSubmitting ? "Saving..." : isEdit ? "Update Sub Category" : "Create Sub Category"}
        </button>
        <Link
          href="/admin/subcategories"
          className="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
