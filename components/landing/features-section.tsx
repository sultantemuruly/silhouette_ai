import { Mail, Search, Star } from "lucide-react";
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
      icon: <Mail className="h-6 w-6" />,
      title: "All Email",
      description:
        "View all your emails in one place with a clean, organized layout. Easily manage and browse your entire inbox.",
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Smart Search",
      description:
        "Ask questions and let the AI search and summarize email threads, saving you time and giving you quick insights.",
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Important Section",
      description:
        "Automatically highlights important messages so you can focus on what matters most, without the clutter.",
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
            Everything you need for email mastery
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Silhouette combines powerful AI with intuitive design to transform
            how you handle email
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
        </div>
      </div>
    </section>
  );
}
