"use client";

import React, { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import { EmailInboxView } from "./email-inbox-view";
import { Button } from "../../ui/button";
import { AlertCircle } from "lucide-react";

const EmailAll: React.FC = () => {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      try {
        const res = await fetch("/api/user/google-connected");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: { connected: boolean } = await res.json();
        setConnected(data.connected);
      } catch (err) {
        console.error(err);
        setConnected(false);
      }
    };
    fetchConnectionStatus();
  }, []);

  if (connected === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader loadingText="Loading..." />
      </div>
    );
  }

  return (
    <div>
      {!connected ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-8 text-center max-w-md">
            <div className="w-full flex items-start gap-4 bg-yellow-100 border border-yellow-300 text-yellow-800 p-5 rounded-lg">
              <AlertCircle className="h-6 w-6 mt-0.5 flex-shrink-0" />
              <p className="text-base font-medium">
                To view your Gmail messages, please connect your Google account.
              </p>
            </div>
            <a href="/api/oauth/google">
              <Button
                variant="regular"
                className="px-8 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Connect Google Account
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="px-4">
          <EmailInboxView />
        </div>
      )}
    </div>
  );
};

export default EmailAll;
