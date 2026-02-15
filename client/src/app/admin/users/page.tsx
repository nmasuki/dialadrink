import { connectDB } from "@/lib/db";
import { AppUser } from "@/models";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import UsersList from "./UsersList";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; order?: string }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();

  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const q = params.q || "";
  const sort = params.sort || "name.first";
  const order = params.order === "desc" ? -1 : 1;

  const query: Record<string, unknown> = {};
  if (q) {
    query.$or = [
      { "name.first": { $regex: q, $options: "i" } },
      { "name.last": { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const [users, count] = await Promise.all([
    AppUser.find(query)
      .select("-password")
      .sort({ [sort]: order })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AppUser.countDocuments(query),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add User
        </Link>
      </div>

      <UsersList
        users={JSON.parse(JSON.stringify(users))}
        totalCount={count}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
