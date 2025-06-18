"use client";

import { Button } from "../ui/button";
import { ArrowRight, Clock, Mail, Sparkles } from "lucide-react";
import { useClerk, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function HeroSection() {
  const { openSignUp } = useClerk();
  const router = useRouter();

  const handleSignUpClick = () => openSignUp();
  const handleDashboardNav = () => {
    router.push("/dashboard");
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Silhouette AI
              </h1>
              <p className="mt-2 text-2xl text-muted-foreground">
                Your invisible edge in email productivity
              </p>
            </div>
            <p className="text-lg text-muted-foreground">
              Smart. Subtle. AI-powered email flow that helps you manage time,
              tone, and priority. Elevate your communication without the
              complexity.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <SignedOut>
                <Button
                  size="lg"
                  className="group"
                  variant="regular"
                  onClick={handleSignUpClick}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </SignedOut>
              <SignedIn>
                <Button
                  size="lg"
                  className="group"
                  variant="regular"
                  onClick={handleDashboardNav}
                >
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </SignedIn>
              {/* <Button size="lg" variant="outline">
                See How It Works
              </Button> */}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden border bg-background shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-12 bg-muted/50 backdrop-blur-sm border-b flex items-center px-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="ml-4 text-sm font-medium">
                  Silhouette AI - Smart Email Assistant
                </div>
              </div>
              <div className="pt-12 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="font-medium">Inbox</div>
                    <div className="text-sm text-muted-foreground">Today</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-md border bg-card">
                      <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-700">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Project Update</div>
                          <div className="text-xs text-muted-foreground">
                            10:30 AM
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          AI has prioritized this email as urgent
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-md border">
                      <div className="h-8 w-8 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Newsletter</div>
                          <div className="text-xs text-muted-foreground">
                            9:15 AM
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          AI has marked this as low priority
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-md border">
                      <div className="h-8 w-8 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Follow-up Scheduled</div>
                          <div className="text-xs text-muted-foreground">
                            Yesterday
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          Automatic follow-up scheduled for tomorrow
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 blur-3xl opacity-50 dark:opacity-30" />
          </div>
        </div>
      </div>
    </section>
  );
}
