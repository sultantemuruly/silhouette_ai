import {
  Calendar,
  LineChart,
  PenTool,
  Bell,
  Filter,
  FileText,
} from "lucide-react";
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
      icon: <Calendar className="h-6 w-6" />,
      title: "Email Scheduling",
      description:
        "Schedule emails at optimal times based on recipient behavior and time zones. Set up automated follow-ups and recurring emails.",
    },
    {
      icon: <PenTool className="h-6 w-6" />,
      title: "AI Writing Assistant",
      description:
        "Real-time grammar correction and tone adjustment. Smart templates for common use cases to save time and improve clarity.",
    },
    {
      icon: <Filter className="h-6 w-6" />,
      title: "Intelligent Prioritization",
      description:
        "AI scans and labels emails by importance. Smart filters and visual indicators help you focus on what matters most.",
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Smart Notifications",
      description:
        "Only get notified for high-priority emails. Custom rules adapt to your workflow and learn from your behavior.",
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "Productivity Analytics",
      description:
        "Track email activity, response times, and get personalized suggestions to improve your communication efficiency.",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Email Templates & Automation",
      description:
        "Create and save custom email templates. Set up automation rules to handle routine emails and save valuable time.",
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
