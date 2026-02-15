"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { TextField, NumberField, SelectField } from "@/components/admin/FormFields";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";

interface PromoData {
  _id?: string;
  name: string;
  code: string;
  key: string;
  discount: number;
  discountType: string;
  startDate?: string;
  endDate?: string;
}

interface PromoFormProps {
  promo?: PromoData;
}

function formatDateValue(d?: string | Date): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export default function PromoForm({ promo }: PromoFormProps) {
  const router = useRouter();
  const isEdit = !!promo?._id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PromoData>({
    defaultValues: {
      name: promo?.name || "",
      code: promo?.code || "",
      key: promo?.key || "",
      discount: promo?.discount || 0,
      discountType: promo?.discountType || "percent",
      startDate: formatDateValue(promo?.startDate),
      endDate: formatDateValue(promo?.endDate),
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

  const onSubmit = async (data: PromoData) => {
    try {
      if (isEdit) {
        await axios.put(`/api/admin/promos/${promo._id}`, data);
        toast.success("Promo updated");
      } else {
        await axios.post("/api/admin/promos", data);
        toast.success("Promo created");
      }
      router.push("/admin/promos");
      router.refresh();
    } catch {
      toast.error(isEdit ? "Failed to update promo" : "Failed to create promo");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/promos" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" /> Back to Promos
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <TextField
          label="Name"
          required
          registration={register("name", { required: "Name is required" })}
          error={errors.name?.message}
        />

        <TextField
          label="Code"
          required
          registration={register("code", { required: "Code is required" })}
          error={errors.code?.message}
        />

        <div>
          <TextField
            label="Key"
            registration={register("key")}
            error={errors.key?.message}
          />
          <button
            type="button"
            onClick={generateKey}
            className="mt-1 text-xs text-teal hover:underline"
          >
            Generate from name
          </button>
        </div>

        <NumberField
          label="Discount"
          registration={register("discount", { valueAsNumber: true })}
          error={errors.discount?.message}
        />

        <SelectField
          label="Discount Type"
          registration={register("discountType")}
          options={[
            { value: "percent", label: "Percent" },
            { value: "fixed", label: "Fixed" },
          ]}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            {...register("startDate")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-teal focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            {...register("endDate")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-teal focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {isSubmitting ? "Saving..." : isEdit ? "Update Promo" : "Create Promo"}
        </button>
        <Link
          href="/admin/promos"
          className="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
