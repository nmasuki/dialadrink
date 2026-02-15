"use client";

import { FiMenu, FiLogOut } from "react-icons/fi";
import { logoutAction } from "@/app/admin/login/actions";

interface TopBarProps {
  userName: string;
  onToggleSidebar: () => void;
}

export default function TopBar({ userName, onToggleSidebar }: TopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
        >
          <FiMenu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{userName}</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
