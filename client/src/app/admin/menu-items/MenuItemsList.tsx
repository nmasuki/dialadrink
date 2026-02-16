"use client";

import { useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiChevronRight, FiChevronDown, FiEdit2, FiTrash2, FiMenu } from "react-icons/fi";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import axios from "axios";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MenuItemChild {
  _id: string;
  label: string;
  href: string;
  type: string;
  index: number;
  level: number;
  show: boolean;
}

interface MenuItemTree extends MenuItemChild {
  submenus?: MenuItemChild[];
}

// Sortable row wrapper
function SortableRow({
  id,
  children,
  disabled,
}: {
  id: string;
  children: (props: {
    listeners: ReturnType<typeof useSortable>["listeners"];
    attributes: ReturnType<typeof useSortable>["attributes"];
    isDragging: boolean;
  }) => React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {children({ listeners, attributes, isDragging })}
    </tr>
  );
}

export default function MenuItemsList({ menuItems: initialItems }: { menuItems: MenuItemTree[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const ids = items.filter((m) => m.submenus && m.submenus.length > 0).map((m) => m._id);
    setExpanded(new Set(ids));
  };

  const collapseAll = () => setExpanded(new Set());

  const filtered = useMemo(() => {
    let result = items;

    // Filter hidden
    if (!showHidden) {
      result = result
        .map((item) => ({
          ...item,
          submenus: item.submenus?.filter((sub) => sub.show),
        }))
        .filter((item) => item.show);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const parentMatch = item.label?.toLowerCase().includes(q) || item.href?.toLowerCase().includes(q);
        const childMatch = item.submenus?.some(
          (sub) => sub.label?.toLowerCase().includes(q) || sub.href?.toLowerCase().includes(q)
        );
        return parentMatch || childMatch;
      });
    }

    return result;
  }, [items, search, showHidden]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/menu-items/${deleteId}`);
      toast.success("Menu item deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete menu item");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i._id === active.id);
    const newIndex = items.findIndex((i) => i._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    // Reassign index per level — items at the same level get sequential indices
    const levelCounters: Record<number, number> = {};
    const updated = reordered.map((item) => {
      const lvl = item.level ?? 1;
      levelCounters[lvl] = (levelCounters[lvl] || 0) + 1;
      return { ...item, index: levelCounters[lvl] };
    });
    setItems(updated);

    // Save to DB
    try {
      await axios.patch("/api/admin/menu-items", {
        items: updated.map((item) => ({ _id: item._id, index: item.index })),
      });
      toast.success("Order saved");
    } catch {
      toast.error("Failed to save order");
      setItems(initialItems); // revert
    }
  };

  const hasAnyChildren = items.some((m) => m.submenus && m.submenus.length > 0);
  const isDndDisabled = search.trim().length > 0;
  const hiddenCount = initialItems.filter((i) => !i.show).length +
    initialItems.reduce((n, i) => n + (i.submenus?.filter((s) => !s.show).length || 0), 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => e.preventDefault()} className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
          />
        </form>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="rounded border-gray-300 text-teal focus:ring-teal"
          />
          Show hidden{hiddenCount > 0 && ` (${hiddenCount})`}
        </label>

        {hasAnyChildren && (
          <div className="flex gap-1">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Tree Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map((i) => i._id)} strategy={verticalListSortingStrategy}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-2 py-3 w-8" />
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Label</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Href</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">Index</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Visible</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        No menu items found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const hasChildren = (item.submenus?.length || 0) > 0;
                      const isExpanded = expanded.has(item._id);
                      return (
                        <Fragment key={item._id}>
                          <SortableRow id={item._id} disabled={isDndDisabled}>
                            {({ listeners, attributes, isDragging }) => (
                              <>
                                <td className="px-2 py-3 w-8">
                                  <button
                                    {...listeners}
                                    {...attributes}
                                    className={`p-1 rounded cursor-grab active:cursor-grabbing ${
                                      isDndDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100 text-gray-400"
                                    } ${isDragging ? "cursor-grabbing" : ""}`}
                                    title={isDndDisabled ? "Clear search to reorder" : "Drag to reorder"}
                                  >
                                    <FiMenu className="w-4 h-4" />
                                  </button>
                                </td>
                                <td
                                  className="px-4 py-3 cursor-pointer"
                                  onClick={() => router.push(`/admin/menu-items/${item._id}`)}
                                >
                                  <div className="flex items-center gap-2">
                                    {hasChildren ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleExpand(item._id);
                                        }}
                                        className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                                      >
                                        {isExpanded ? (
                                          <FiChevronDown className="w-4 h-4 text-gray-500" />
                                        ) : (
                                          <FiChevronRight className="w-4 h-4 text-gray-500" />
                                        )}
                                      </button>
                                    ) : (
                                      <span className="w-5" />
                                    )}
                                    <span className={`font-medium ${!item.show ? "text-gray-400" : "text-gray-800"}`}>
                                      {item.label}
                                    </span>
                                    {!item.show && (
                                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">hidden</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{item.href || "—"}</td>
                                <td className="px-4 py-3 text-gray-500">{item.type || "—"}</td>
                                <td className="px-4 py-3 text-gray-500">{item.index ?? 0}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      item.show ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {item.show ? "Yes" : "No"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => router.push(`/admin/menu-items/${item._id}`)}
                                      className="p-2 text-gray-500 hover:text-teal rounded-lg hover:bg-gray-100"
                                      title="Edit"
                                    >
                                      <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteId(item._id)}
                                      className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                                      title="Delete"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </SortableRow>
                          {hasChildren &&
                            isExpanded &&
                            item.submenus!.map((child) => (
                              <tr
                                key={child._id}
                                className={`hover:bg-gray-50 cursor-pointer ${!child.show ? "opacity-60" : ""}`}
                                onClick={() => router.push(`/admin/menu-items/${child._id}`)}
                              >
                                <td className="px-2 py-3 w-8" />
                                <td className="pl-14 pr-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-300">└</span>
                                    <span className={`font-medium ${!child.show ? "text-gray-400" : "text-gray-600"}`}>
                                      {child.label}
                                    </span>
                                    {!child.show && (
                                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">hidden</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{child.href || "—"}</td>
                                <td className="px-4 py-3 text-gray-500">{child.type || "—"}</td>
                                <td className="px-4 py-3 text-gray-500">{child.index ?? 0}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      child.show ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {child.show ? "Yes" : "No"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div
                                    className="flex items-center justify-end gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => router.push(`/admin/menu-items/${child._id}`)}
                                      className="p-2 text-gray-500 hover:text-teal rounded-lg hover:bg-gray-100"
                                      title="Edit"
                                    >
                                      <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteId(child._id)}
                                      className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                                      title="Delete"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </div>
  );
}
