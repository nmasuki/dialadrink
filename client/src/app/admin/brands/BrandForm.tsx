"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { TextField, SelectField } from "@/components/admin/FormFields";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";

interface BrandData {
  _id?: string;
  name: string;
  href: string;
  state: string;
}

interface BrandFormProps {
  brand?: BrandData;
}

export default function BrandForm({ brand }: BrandFormProps) {
  const router = useRouter();
  const isEdit = !!brand?._id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<BrandData>({
    defaultValues: {
      name: brand?.name || "",
      href: brand?.href || "",
      state: brand?.state || "published",
    },
  });

  const nameValue = watch("name");

  const generateSlug = () => {
    const slug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("href", slug);
  };

  const onSubmit = async (data: BrandData) => {
    try {
      if (isEdit) {
        await axios.put(`/api/admin/brands/${brand._id}`, data);
        toast.success("Brand updated");
      } else {
        await axios.post("/api/admin/brands", data);
        toast.success("Brand created");
      }
      router.push("/admin/brands");
      router.refresh();
    } catch {
      toast.error(isEdit ? "Failed to update brand" : "Failed to create brand");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/brands" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" /> Back to Brands
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
            label="Slug (href)"
            registration={register("href")}
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

        <SelectField
          label="State"
          registration={register("state")}
          options={[
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {isSubmitting ? "Saving..." : isEdit ? "Update Brand" : "Create Brand"}
        </button>
        <Link
          href="/admin/brands"
          className="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
