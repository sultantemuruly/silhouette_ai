import { Check } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Connect your email",
      description:
        "Securely connect your existing email account to Silhouette in seconds.",
    },
    {
      number: "02",
      title: "Write or generate with AI",
      description:
        "Let AI draft, rewrite, or polish your emails. Or generate stunning templates for any occasion.",
    },
    {
      number: "03",
      title: "Schedule or send instantly",
      description:
        "Send right away or schedule for later. Stay organized and professional with ease.",
    },
  ];

  const benefits = [
    "Write emails 5x faster with AI assistance",
    "Always sound professional and on-brand",
    "Create beautiful, reusable templates in seconds",
    "Never miss a follow-up with easy scheduling",
    "Reduce stress and save time every day",
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          <div>
            <div className="inline-block rounded-lg bg-blue-600/10 text-blue-700 px-3 py-1 text-sm mb-4">
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Start working smarter in minutes
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg/relaxed">
              Silhouette integrates seamlessly with your existing email
              workflow, providing immediate benefits without a steep learning
              curve.
            </p>

            <div className="mt-8 space-y-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-600/10 p-1 text-blue-700">
                    <Check className="h-5 w-5" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="relative pl-8 border-l">
                <div className="absolute left-0 flex items-center justify-center w-8 h-8 -translate-x-1/2 rounded-full bg-blue-600 text-primary-foreground text-sm font-medium">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
