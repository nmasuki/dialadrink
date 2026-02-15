import { connectDB } from "@/lib/db";
import { AppUser } from "@/models";
import { notFound } from "next/navigation";
import UserForm from "../UserForm";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const user = await AppUser.findById(id).select("-password").lean();
  if (!user) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit User</h1>
      <UserForm user={JSON.parse(JSON.stringify(user))} />
    </div>
  );
}
