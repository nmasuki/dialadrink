"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";

interface PriceOption {
  _id: string;
  optionText?: string;
  price: number;
  offerPrice?: number;
  currency: string;
  inStock?: boolean;
}

interface ProductRow {
  _id: string;
  name: string;
  href: string;
  image?: { secure_url: string };
  category?: { _id: string; name: string };
  brand?: { _id: string; name: string };
  price: number;
  priceOptions?: PriceOption[];
  state: string;
  inStock: boolean;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0 }).format(n);

const getDisplayPrice = (p: ProductRow) => {
  if (p.priceOptions && p.priceOptions.length > 0) {
    const prices = p.priceOptions.map((o) => o.offerPrice || o.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `KES ${formatPrice(min)}`;
    return `KES ${formatPrice(min)} – ${formatPrice(max)}`;
  }
  return `KES ${formatPrice(p.price || 0)}`;
};

const columns: Column<ProductRow>[] = [
  {
    key: "image",
    label: "",
    className: "w-12",
    render: (p) =>
      p.image?.secure_url ? (
        <Image
          src={p.image.secure_url}
          alt={p.name}
          width={40}
          height={40}
          className="w-10 h-10 object-cover rounded"
        />
      ) : (
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
          No img
        </div>
      ),
  },
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (p) => (
      <div>
        <p className="font-medium">{p.name}</p>
        <p className="text-xs text-gray-500">{p.href}</p>
      </div>
    ),
  },
  {
    key: "category",
    label: "Category",
    render: (p) => <span className="text-gray-600">{p.category?.name || "—"}</span>,
  },
  {
    key: "brand",
    label: "Brand",
    render: (p) => <span className="text-gray-600">{p.brand?.name || "—"}</span>,
  },
  {
    key: "price",
    label: "Price",
    sortable: true,
    render: (p) => <span className="font-medium text-sm">{getDisplayPrice(p)}</span>,
  },
  {
    key: "state",
    label: "Status",
    sortable: true,
    render: (p) => (
      <div className="flex flex-col gap-1">
        <StatusBadge status={p.state} />
        {!p.inStock && (
          <span className="text-xs text-red-500 font-medium">Out of stock</span>
        )}
      </div>
    ),
  },
];

export default function ProductsList({
  products,
  totalCount,
  page,
  pageSize,
  categories,
  brands,
}: {
  products: ProductRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  categories: { _id: string; name: string }[];
  brands: { _id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/products/${id}`);
      toast.success("Product deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={searchParams.get("state") || ""}
          onChange={(e) => updateFilter("state", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All States</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={searchParams.get("category") || ""}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("brand") || ""}
          onChange={(e) => updateFilter("brand", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        basePath="/admin/products"
        onDelete={handleDelete}
        searchPlaceholder="Search by name or tag..."
      />
    </div>
  );
}
