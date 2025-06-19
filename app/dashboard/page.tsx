"use client";

import { Navbar } from "@/components/dashboard/bars/navbar";
import { ResponsiveSidebar } from "@/components/dashboard/bars/responsive-sidebar";

// import EmailAll from "@/components/dashboard/email-view/email-all";
import EmailSearch from "@/components/dashboard/email-search/email-search";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        {/* Left: sidebar */}
        <ResponsiveSidebar />

        {/* Right: main content (grows to fill) */}
        <main className="flex-1 overflow-auto p-4">
          {/* <EmailAll /> */}
          <EmailSearch />
          {/* + future panels here */}
        </main>
      </div>
    </div>
  );
}
