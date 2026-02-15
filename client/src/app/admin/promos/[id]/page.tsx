import { connectDB } from "@/lib/db";
import { Promo } from "@/models";
import { notFound } from "next/navigation";
import PromoForm from "../PromoForm";

export const dynamic = "force-dynamic";

export default async function EditPromoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const promo = await Promo.findById(id).lean();
  if (!promo) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Promo</h1>
      <PromoForm promo={JSON.parse(JSON.stringify(promo))} />
    </div>
  );
}
