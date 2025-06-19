// app/dashboard/page.tsx  (or pages/dashboard.tsx)
"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { ResponsiveSidebar } from "@/components/dashboard/responsive-sidebar";
import EmailAll from "@/components/dashboard/email-all";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        {/* Left: sidebar */}
        <ResponsiveSidebar />

        {/* Right: main content (grows to fill) */}
        <main className="flex-1 overflow-auto p-4">
          <EmailAll />
          {/* + future panels here */}
        </main>
      </div>
    </div>
  );
}
