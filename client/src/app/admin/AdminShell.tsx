"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";

interface AdminShellProps {
  counts: Record<string, number>;
  userName: string;
  children: React.ReactNode;
}

export default function AdminShell({ counts, userName, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        counts={counts}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <TopBar
          userName={userName}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
