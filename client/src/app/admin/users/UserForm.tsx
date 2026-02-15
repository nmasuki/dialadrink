"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { TextField, SelectField, CheckboxField } from "@/components/admin/FormFields";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";

interface UserData {
  _id?: string;
  name: { first: string; last: string };
  email: string;
  password?: string;
  phoneNumber: string;
  accountStatus: string;
  accountType: string;
  receivesOrders: boolean;
}

interface UserFormProps {
  user?: UserData;
}

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!user?._id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserData>({
    defaultValues: {
      name: {
        first: user?.name?.first || "",
        last: user?.name?.last || "",
      },
      email: user?.email || "",
      password: "",
      phoneNumber: user?.phoneNumber || "",
      accountStatus: user?.accountStatus || "Active",
      accountType: user?.accountType || "",
      receivesOrders: user?.receivesOrders || false,
    },
  });

  const onSubmit = async (data: UserData) => {
    try {
      if (isEdit) {
        await axios.put(`/api/admin/users/${user._id}`, data);
        toast.success("User updated");
      } else {
        await axios.post("/api/admin/users", data);
        toast.success("User created");
      }
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(isEdit ? "Failed to update user" : "Failed to create user");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="First Name"
            required
            registration={register("name.first", { required: "First name is required" })}
            error={errors.name?.first?.message}
          />
          <TextField
            label="Last Name"
            required
            registration={register("name.last", { required: "Last name is required" })}
            error={errors.name?.last?.message}
          />
        </div>

        <TextField
          label="Email"
          type="email"
          required
          registration={register("email", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
          })}
          error={errors.email?.message}
        />

        <TextField
          label={isEdit ? "Password (leave blank to keep current)" : "Password"}
          type="password"
          required={!isEdit}
          registration={register("password", {
            ...(!isEdit && {
              required: "Password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            }),
          })}
          error={errors.password?.message}
        />

        <TextField
          label="Phone Number"
          registration={register("phoneNumber")}
          error={errors.phoneNumber?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Account Status"
            registration={register("accountStatus")}
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
              { value: "Suspended", label: "Suspended" },
            ]}
          />

          <SelectField
            label="Account Type"
            registration={register("accountType")}
            options={[
              { value: "admin", label: "Admin" },
              { value: "manager", label: "Manager" },
              { value: "staff", label: "Staff" },
            ]}
          />
        </div>

        <CheckboxField
          label="Receives Orders"
          registration={register("receivesOrders")}
          helper="User will receive order notifications"
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {isSubmitting ? "Saving..." : isEdit ? "Update User" : "Create User"}
        </button>
        <Link
          href="/admin/users"
          className="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
