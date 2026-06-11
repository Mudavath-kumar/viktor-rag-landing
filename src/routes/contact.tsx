import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, SectionEyebrow, PrimaryBtn } from "@/components/site-chrome";
import { Mail, MessageSquare, MapPin, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Viktor RAG" },
      { name: "description", content: "Talk to the Viktor RAG team about enterprise deployments, partnerships, or support." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <PageShell>
      <section className="px-6 max-w-[1100px] mx-auto pb-24 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <SectionEyebrow>Contact</SectionEyebrow>
          <h1 className="mt-3 text-[40px] md:text-[56px] leading-[0.95] tracking-tight">
            Say <span className="font-mondwest text-[#1f5d4f]">hello</span>.
          </h1>
          <p className="mt-5 text-[#273C46]">We answer every message within one business day. Usually faster.</p>
          <ul className="mt-10 space-y-5 text-sm">
            <li className="flex items-start gap-3"><Mail className="w-4 h-4 mt-0.5 text-[#1f5d4f]" /><div><p className="font-medium">hello@viktorrag.com</p><p className="text-[#273C46]">General + sales</p></div></li>
            <li className="flex items-start gap-3"><MessageSquare className="w-4 h-4 mt-0.5 text-[#1f5d4f]" /><div><p className="font-medium">support@viktorrag.com</p><p className="text-[#273C46]">For existing customers</p></div></li>
            <li className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-[#1f5d4f]" /><div><p className="font-medium">Brooklyn · Berlin · Bengaluru</p><p className="text-[#273C46]">Remote-first, three timezones</p></div></li>
          </ul>
        </div>

        <div className="md:col-span-3 bg-white rounded-3xl p-8 md:p-10 border border-[#051A24]/5">
          {sent ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#1f5d4f]/10 grid place-items-center">
                <ArrowRight className="w-6 h-6 text-[#1f5d4f]" />
              </div>
              <h2 className="mt-6 font-mondwest text-4xl">Thanks — we got it.</h2>
              <p className="mt-3 text-[#273C46]">A human will be in touch shortly.</p>
              <Link to="/" className="mt-8 inline-block"><PrimaryBtn>Back home</PrimaryBtn></Link>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
              <h2 className="text-xl font-medium">Send us a message</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name" placeholder="Ada Lovelace" />
                <Field label="Email" type="email" placeholder="you@company.com" />
              </div>
              <Field label="Company" placeholder="Acme Research" />
              <label className="block">
                <span className="text-xs text-[#273C46] uppercase tracking-wide">Topic</span>
                <select className="mt-1 w-full rounded-2xl border border-[#051A24]/10 bg-[#f0f0ee] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5d4f]">
                  <option>Enterprise deployment</option>
                  <option>Partnerships</option>
                  <option>Press / podcast</option>
                  <option>Support</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-[#273C46] uppercase tracking-wide">Message</span>
                <textarea required rows={5} placeholder="Tell us a little about your project." className="mt-1 w-full rounded-2xl border border-[#051A24]/10 bg-[#f0f0ee] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5d4f] resize-none" />
              </label>
              <PrimaryBtn className="inline-flex items-center gap-2">Send message <ArrowRight className="w-4 h-4" /></PrimaryBtn>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs text-[#273C46] uppercase tracking-wide">{label}</span>
      <input required type={type} placeholder={placeholder} className="mt-1 w-full rounded-full border border-[#051A24]/10 bg-[#f0f0ee] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5d4f]" />
    </label>
  );
}
