import { connectDB } from "@/lib/db";
import { Location } from "@/models";
import { notFound } from "next/navigation";
import LocationForm from "../LocationForm";

export const dynamic = "force-dynamic";

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const location = await Location.findById(id).lean();
  if (!location) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Location</h1>
      <LocationForm location={JSON.parse(JSON.stringify(location))} />
    </div>
  );
}
