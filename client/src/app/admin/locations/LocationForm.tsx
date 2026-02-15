"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { TextField, NumberField, CheckboxField } from "@/components/admin/FormFields";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";

interface LocationData {
  _id?: string;
  name: string;
  href: string;
  city: string;
  deliveryCharges: number;
  show: boolean;
  location: { lat: number; lng: number };
}

export default function LocationForm({ location }: { location?: LocationData }) {
  const router = useRouter();
  const isEdit = !!location?._id;
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<LocationData>({
    defaultValues: {
      name: location?.name || "",
      href: location?.href || "",
      city: location?.city || "Nairobi",
      deliveryCharges: location?.deliveryCharges || 200,
      show: location?.show ?? true,
      location: { lat: location?.location?.lat || 0, lng: location?.location?.lng || 0 },
    },
  });

  const nameValue = watch("name");
  const generateSlug = () => {
    setValue("href", nameValue.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const onSubmit = async (data: LocationData) => {
    try {
      if (isEdit) { await axios.put(`/api/admin/locations/${location._id}`, data); toast.success("Location updated"); }
      else { await axios.post("/api/admin/locations", data); toast.success("Location created"); }
      router.push("/admin/locations");
      router.refresh();
    } catch { toast.error(isEdit ? "Failed to update location" : "Failed to create location"); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/locations" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1"><FiArrowLeft className="w-4 h-4" /> Back to Locations</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <TextField label="Name" required registration={register("name", { required: "Name is required" })} error={errors.name?.message} />
        <div>
          <TextField label="Slug (href)" registration={register("href")} error={errors.href?.message} helper="URL-friendly identifier" />
          <button type="button" onClick={generateSlug} className="mt-1 text-xs text-teal hover:underline">Generate from name</button>
        </div>
        <TextField label="City" registration={register("city")} />
        <NumberField label="Delivery Charges (KES)" registration={register("deliveryCharges", { valueAsNumber: true })} />
        <CheckboxField label="Visible on site" registration={register("show")} />
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Latitude" registration={register("location.lat", { valueAsNumber: true })} />
          <NumberField label="Longitude" registration={register("location.lng", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50">
          <FiSave className="w-4 h-4" />{isSubmitting ? "Saving..." : isEdit ? "Update Location" : "Create Location"}
        </button>
        <Link href="/admin/locations" className="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</Link>
      </div>
    </form>
  );
}
