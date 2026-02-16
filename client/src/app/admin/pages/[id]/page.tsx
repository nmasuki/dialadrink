import { connectDB } from "@/lib/db";
import { Page } from "@/models";
import { notFound } from "next/navigation";
import PageForm from "../PageForm";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const page = await Page.findById(id).lean();
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Page</h1>
      <PageForm page={JSON.parse(JSON.stringify(page))} />
    </div>
  );
}
