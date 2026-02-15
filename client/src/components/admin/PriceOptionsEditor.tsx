"use client";

import { useState } from "react";
import { FiPlus, FiTrash2, FiSave, FiLoader } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface PriceOption {
  _id?: string;
  optionText: string;
  price: number;
  offerPrice?: number;
  currency: string;
  inStock: boolean;
}

interface PriceOptionsEditorProps {
  productId?: string;
  value: PriceOption[];
  onChange: (options: PriceOption[]) => void;
}

export default function PriceOptionsEditor({
  productId,
  value,
  onChange,
}: PriceOptionsEditorProps) {
  const [saving, setSaving] = useState<string | null>(null);

  const addRow = () => {
    onChange([
      ...value,
      { optionText: "", price: 0, offerPrice: undefined, currency: "KES", inStock: true },
    ]);
  };

  const updateRow = (index: number, field: string, val: string | number | boolean) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const saveRow = async (index: number) => {
    const row = value[index];
    if (!productId) return;

    setSaving(String(index));
    try {
      if (row._id) {
        const res = await axios.put(`/api/admin/price-options/${row._id}`, {
          optionText: row.optionText,
          price: row.price,
          offerPrice: row.offerPrice || null,
          currency: row.currency,
          inStock: row.inStock,
        });
        toast.success("Price option updated");
        const updated = [...value];
        updated[index] = res.data.data;
        onChange(updated);
      } else {
        const res = await axios.post("/api/admin/price-options", {
          productId,
          optionText: row.optionText,
          price: row.price,
          offerPrice: row.offerPrice || null,
          currency: row.currency,
          inStock: row.inStock,
        });
        toast.success("Price option created");
        const updated = [...value];
        updated[index] = res.data.data;
        onChange(updated);
      }
    } catch {
      toast.error("Failed to save price option");
    } finally {
      setSaving(null);
    }
  };

  const deleteRow = async (index: number) => {
    const row = value[index];
    if (row._id) {
      try {
        await axios.delete(`/api/admin/price-options/${row._id}`);
        toast.success("Price option deleted");
      } catch {
        toast.error("Failed to delete price option");
        return;
      }
    }
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">Price Options</label>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium"
        >
          <FiPlus className="w-3 h-3" /> Add Option
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          No price options. Use the product&apos;s base price field, or add options for variant pricing.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-2 text-left font-medium text-gray-600">Option Text</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Price</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Offer Price</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">In Stock</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {value.map((row, i) => (
                <tr key={row._id || `new-${i}`} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.optionText || ""}
                      onChange={(e) => updateRow(i, "optionText", e.target.value)}
                      placeholder="e.g. 750ml"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.price || ""}
                      onChange={(e) => updateRow(i, "price", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.offerPrice ?? ""}
                      onChange={(e) =>
                        updateRow(i, "offerPrice", e.target.value ? parseFloat(e.target.value) : "")
                      }
                      placeholder="—"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.inStock !== false}
                      onChange={(e) => updateRow(i, "inStock", e.target.checked)}
                      className="w-4 h-4 accent-teal"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {productId && (
                        <button
                          type="button"
                          onClick={() => saveRow(i)}
                          disabled={saving === String(i)}
                          className="p-1.5 text-gray-500 hover:text-teal rounded hover:bg-gray-100 disabled:opacity-50"
                          title="Save"
                        >
                          {saving === String(i) ? (
                            <FiLoader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiSave className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteRow(i)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
                        title="Delete"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!productId && value.length > 0 && (
        <p className="mt-2 text-xs text-amber-600">
          Save the product first, then you can save individual price options.
        </p>
      )}
    </div>
  );
}
