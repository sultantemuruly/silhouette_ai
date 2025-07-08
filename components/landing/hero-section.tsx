"use client";

import { Button } from "../ui/button";
import { ArrowRight, Clock, Mail, Sparkles } from "lucide-react";
import { useClerk, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { trackGtag } from "@/lib/gtag";

export function HeroSection() {
  const { openSignUp } = useClerk();
  const router = useRouter();

  const handleSignUpClick = () => {
    trackGtag('get_started_click', 'auth');
    openSignUp();
  };
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
                Effortless AI Email Writing & Beautiful Templates
              </p>
            </div>
            <p className="text-lg text-muted-foreground">
              Instantly craft professional emails and stunning templates with AI. Write, schedule, and send with confidence—no more writer’s block or formatting headaches.
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
                  Silhouette AI - Email Writing & Templates
                </div>
              </div>
              <div className="pt-12 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="font-medium">Compose</div>
                    <div className="text-sm text-muted-foreground">AI Powered</div>
                  </div>
                  <div className="space-y-3">
                    {/* AI Email Writing Example */}
                    <div className="flex items-start gap-3 p-3 rounded-md border bg-card">
                      <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-black">AI Email Writing</div>
                          <div className="text-xs text-slate-900">Instant Draft</div>
                        </div>
                        <div className="text-sm text-black">
                          &quot;Hi team, just a quick update on our project...&quot;<br />
                          <span className="text-blue-600">AI continues your message with clarity and professionalism.</span>
                        </div>
                      </div>
                    </div>
                    {/* Template Generation Example */}
                    <div className="flex items-start gap-3 p-3 rounded-md border bg-card">
                      <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-black">Template Generation</div>
                          <div className="text-xs text-slate-900">1-Click Design</div>
                        </div>
                        <div className="text-sm text-black">
                          Choose a template or let AI design one for you—perfect for every occasion.
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
