"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { TextField, NumberField, SelectField, CheckboxField } from "@/components/admin/FormFields";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";

interface MenuItemData {
  _id?: string;
  label: string;
  href: string;
  index: number;
  level: number;
  type: string;
  show: boolean;
}

interface MenuItemFormProps {
  menuItem?: MenuItemData;
}

export default function MenuItemForm({ menuItem }: MenuItemFormProps) {
  const router = useRouter();
  const isEdit = !!menuItem?._id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemData>({
    defaultValues: {
      label: menuItem?.label || "",
      href: menuItem?.href || "",
      index: menuItem?.index ?? 0,
      level: menuItem?.level ?? 0,
      type: menuItem?.type || "top",
      show: menuItem?.show ?? true,
    },
  });

  const onSubmit = async (data: MenuItemData) => {
    try {
      if (isEdit) {
        await axios.put(`/api/admin/menu-items/${menuItem._id}`, data);
        toast.success("Menu item updated");
      } else {
        await axios.post("/api/admin/menu-items", data);
        toast.success("Menu item created");
      }
      router.push("/admin/menu-items");
      router.refresh();
    } catch {
      toast.error(isEdit ? "Failed to update menu item" : "Failed to create menu item");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/menu-items" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" /> Back to Menu Items
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <TextField
          label="Label"
          required
          registration={register("label", { required: "Label is required" })}
          error={errors.label?.message}
        />

        <TextField
          label="Href"
          registration={register("href")}
          error={errors.href?.message}
        />

        <NumberField
          label="Index"
          registration={register("index", { valueAsNumber: true })}
          error={errors.index?.message}
        />

        <NumberField
          label="Level"
          registration={register("level", { valueAsNumber: true })}
          error={errors.level?.message}
        />

        <SelectField
          label="Type"
          registration={register("type")}
          options={[
            { value: "top", label: "Top" },
            { value: "footer", label: "Footer" },
            { value: "mobile", label: "Mobile" },
          ]}
        />

        <CheckboxField
          label="Show"
          registration={register("show")}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {isSubmitting ? "Saving..." : isEdit ? "Update Menu Item" : "Create Menu Item"}
        </button>
        <Link
          href="/admin/menu-items"
          className="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
