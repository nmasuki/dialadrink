"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiPackage, FiTag, FiGrid, FiList, FiShoppingBag, FiUsers, FiExternalLink, FiCode, FiMapPin, FiMenu, FiPercent } from "react-icons/fi";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  countKey?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: FiHome },
  { label: "Products", href: "/admin/products", icon: FiPackage, countKey: "products" },
  { label: "Brands", href: "/admin/brands", icon: FiTag, countKey: "brands" },
  { label: "Categories", href: "/admin/categories", icon: FiGrid, countKey: "categories" },
  { label: "Sub-Categories", href: "/admin/subcategories", icon: FiList, countKey: "subcategories" },
  { label: "Orders", href: "/admin/orders", icon: FiShoppingBag, countKey: "orders" },
  { label: "Users", href: "/admin/users", icon: FiUsers, countKey: "users" },
  { label: "Locations", href: "/admin/locations", icon: FiMapPin, countKey: "locations" },
  { label: "Menu Items", href: "/admin/menu-items", icon: FiMenu, countKey: "menuItems" },
  { label: "Promos", href: "/admin/promos", icon: FiPercent, countKey: "promos" },
  { label: "API Docs", href: "/admin/api-docs", icon: FiCode },
];

interface SidebarProps {
  counts: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ counts, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-lg font-bold">Dial A Drink</h1>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const count = item.countKey ? counts[item.countKey] : undefined;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-teal text-white font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    active ? "bg-white/20" : "bg-gray-700"
                  }`}>
                    {count.toLocaleString()}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <FiExternalLink className="w-5 h-5" />
            Back to Site
          </Link>
        </div>
      </aside>
    </>
  );
}
