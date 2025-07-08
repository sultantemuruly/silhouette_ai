import { Mail, Search, Star, Sparkles, Calendar, LayoutTemplate } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function FeaturesSection() {
  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Wise Write",
      description:
        "Let AI draft, rewrite, or polish your emails instantly. Say goodbye to writer’s block and hello to professional communication.",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Easy Schedule",
      description:
        "Schedule emails to send later or set up follow-ups with just a click. Stay on top of your communication, effortlessly.",
    },
    {
      icon: <LayoutTemplate className="h-6 w-6" />,
      title: "Fancy Template",
      description:
        "Create or generate beautiful email templates for any occasion. Personalize and reuse with ease.",
    },
  ];

  const comingSoon = [
    {
      icon: <Mail className="h-6 w-6 opacity-50" />,
      title: "All Mail",
      description: "Unified inbox for all your emails. (Coming Soon)",
    },
    {
      icon: <Search className="h-6 w-6 opacity-50" />,
      title: "Smart Search",
      description: "AI-powered search and summaries. (Coming Soon)",
    },
    {
      icon: <Star className="h-6 w-6 opacity-50" />,
      title: "Important",
      description: "Automatic important email detection. (Coming Soon)",
    },
  ];

  return (
    <section id="features" className="py-20 bg-blue-100/10">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-block rounded-lg px-3 py-1 text-sm bg-blue-600/10 text-blue-700">
            Core Features
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            AI Email Writing & Templates, Simplified
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Silhouette helps you write, schedule, and design emails with the power of AI. More features coming soon!
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {features.map((feature, i) => (
            <Card key={i} className="bg-background">
              <CardHeader>
                <div className="p-2 w-fit rounded-md bg-blue-500/10 text-blue-700 mb-3">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
          {comingSoon.map((feature, i) => (
            <Card key={features.length + i} className="bg-muted/30 opacity-60">
              <CardHeader>
                <div className="p-2 w-fit rounded-md bg-blue-200/30 text-blue-400 mb-3">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
