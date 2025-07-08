import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Check } from "lucide-react";

export function PricingSection() {
  const plans = [
    {
      name: "Personal",
      price: "$10",
      description: "Perfect for individual professionals",
      features: [
        "AI email writing assistance",
        "Email scheduling & follow-ups",
        "Template generation & customization",
        "1 email account",
      ],
      cta: "Start Free Trial",
    },
    {
      name: "Team",
      price: "$30",
      description: "Ideal for small teams and businesses",
      features: [
        "Everything in Personal",
        "Team template sharing",
        "Collaborative writing",
        "Up to 5 team members",
        "Multiple email accounts",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For organizations with advanced needs",
      features: [
        "Everything in Team",
        "Custom integrations",
        "Advanced security features",
        "Dedicated support",
        "Custom user roles",
        "Unlimited team members",
      ],
      cta: "Contact Sales",
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-blue-100/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-block bg-blue-600/10 text-blue-700 rounded-lg px-3 py-1 text-sm">
            Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 mt-12">
          {plans.map((plan, i) => (
            <Card
              key={i}
              className={`flex flex-col ${
                plan.popular ? "border-blue-600 shadow-lg" : ""
              }`}
            >
              <CardHeader>
                {plan.popular && (
                  <div className="inline-block rounded-full px-3 py-1 text-xs bg-blue-600 text-primary-foreground mb-2">
                    Most Popular
                  </div>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground ml-1">/month</span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "regular" : "outline"}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
