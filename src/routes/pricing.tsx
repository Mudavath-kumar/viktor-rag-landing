import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, SectionEyebrow, PrimaryBtn, SecondaryBtn } from "@/components/site-chrome";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Viktor RAG" },
      {
        name: "description",
        content: "Transparent pricing for teams who need verified answers from their documents.",
      },
      { property: "og:title", content: "Pricing — Viktor RAG" },
      {
        property: "og:description",
        content: "Free forever for solo builders. Scale-friendly for teams and enterprise.",
      },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Starter",
    price: { m: 0, y: 0 },
    note: "Free forever",
    blurb: "For solo builders and weekend projects.",
    features: [
      "10K queries / month",
      "500 documents",
      "Basic verification",
      "Community support",
      "1 workspace",
    ],
  },
  {
    name: "Team",
    price: { m: 49, y: 39 },
    note: "per seat / month",
    blurb: "Verified knowledge for working teams.",
    features: [
      "Unlimited queries",
      "25K documents",
      "Full verification + citations",
      "Shared workspaces",
      "Slack & email support",
      "API access",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: null,
    note: "Custom",
    blurb: "SSO, audit logs, and dedicated infra.",
    features: [
      "Unlimited everything",
      "SSO / SCIM",
      "Audit logs",
      "Private VPC",
      "Dedicated CSM",
      "99.9% SLA",
    ],
  },
];

const faqs = [
  [
    "Is there really a free tier?",
    "Yes. 10K queries and 500 documents per month, no credit card required.",
  ],
  [
    "Can I host this on my own infra?",
    "Enterprise customers can deploy Viktor RAG in their own VPC on AWS, GCP, or Azure.",
  ],
  [
    "Which models do you support?",
    "We default to GPT-4o-class models and support Claude, Gemini, and open-weight models on Team and Enterprise.",
  ],
  [
    "How is verification billed?",
    "Verification runs on every answer at no extra cost on every plan.",
  ],
];

function PricingPage() {
  const [yearly, setYearly] = useState(true);
  return (
    <PageShell>
      <section className="px-6 max-w-[1200px] mx-auto pb-20">
        <div className="text-center">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h1 className="mt-3 text-[44px] md:text-[68px] leading-[0.95] tracking-tight">
            Honest pricing.
            <br />
            <span className="font-mondwest text-[#1f5d4f]">Verified</span> outcomes.
          </h1>
          <div className="mt-8 inline-flex bg-[#EDEDED] rounded-full p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${!yearly ? "bg-white shadow text-[#051A24]" : "text-[#273C46]"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${yearly ? "bg-white shadow text-[#051A24]" : "text-[#273C46]"}`}
            >
              Yearly{" "}
              <span className="text-[10px] bg-[#1f5d4f] text-white px-2 py-0.5 rounded-full">
                −20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl p-8 border ${p.featured ? "bg-[#051A24] text-white border-[#051A24]" : "bg-white border-[#051A24]/5"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium">{p.name}</h3>
                {p.featured && (
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#5cc9b1] bg-[#5cc9b1]/15 px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Popular
                  </span>
                )}
              </div>
              <div className="mt-6">
                {p.price === null ? (
                  <p className="font-mondwest text-6xl">Let's talk</p>
                ) : (
                  <p className="font-mondwest text-6xl">
                    ${yearly ? p.price.y : p.price.m}
                    <span
                      className={`text-base font-sans ${p.featured ? "text-[#E0EBF0]" : "text-[#273C46]"}`}
                    >
                      {p.price.m > 0 ? "/mo" : ""}
                    </span>
                  </p>
                )}
                <p className={`mt-2 text-xs ${p.featured ? "text-[#E0EBF0]" : "text-[#273C46]"}`}>
                  {p.note}
                </p>
              </div>
              <p className={`mt-6 text-sm ${p.featured ? "text-[#E0EBF0]" : "text-[#273C46]"}`}>
                {p.blurb}
              </p>
              <ul
                className={`mt-8 space-y-3 text-sm border-t pt-6 ${p.featured ? "border-white/10" : "border-[#051A24]/5"}`}
              >
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check
                      className={`w-4 h-4 mt-0.5 shrink-0 ${p.featured ? "text-[#5cc9b1]" : "text-[#1f5d4f]"}`}
                    />{" "}
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to={p.price === null ? "/contact" : "/signup"} className="block">
                  {p.featured ? (
                    <PrimaryBtn className="w-full !bg-white !text-[#051A24]">
                      Start 14-day trial
                    </PrimaryBtn>
                  ) : (
                    <SecondaryBtn className="w-full">
                      {p.price === null ? "Contact sales" : "Get started"}
                    </SecondaryBtn>
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24">
          <SectionEyebrow>Questions</SectionEyebrow>
          <h2 className="mt-3 text-3xl md:text-5xl tracking-tight">Asked, answered.</h2>
          <div className="mt-10 divide-y divide-[#051A24]/10 border-y border-[#051A24]/10">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-6">
                <summary className="cursor-pointer flex justify-between items-center list-none">
                  <span className="font-medium text-lg">{q}</span>
                  <span className="text-2xl text-[#1f5d4f] group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[#273C46] max-w-2xl">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
