import { Mail, Phone, MapPin, Clock3 } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Contact us</p>
            <h1 className="mt-2 text-4xl font-semibold text-zinc-900">We’d love to hear from you</h1>
            <p className="mt-4 text-lg leading-8 text-zinc-600">Whether you’re ordering a custom piece or sharing a special occasion, the studio is here to help.</p>
            <form className="mt-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="Name" className="rounded-full border border-zinc-300 px-4 py-3" />
                <input placeholder="Email" className="rounded-full border border-zinc-300 px-4 py-3" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="Phone" className="rounded-full border border-zinc-300 px-4 py-3" />
                <input placeholder="Subject" className="rounded-full border border-zinc-300 px-4 py-3" />
              </div>
              <textarea rows={5} placeholder="Message" className="w-full rounded-[1.5rem] border border-zinc-300 px-4 py-3" />
              <button className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white">Send message</button>
            </form>
          </div>
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-rose-100 bg-[#FFF8F2] p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-zinc-900">Visit the studio</h2>
              <div className="mt-6 space-y-4 text-sm text-zinc-600">
                <div className="flex items-start gap-3"><Mail className="mt-1 text-rose-500" size={18} /> <span>support@crochetandbliss.com</span></div>
                <div className="flex items-start gap-3"><Phone className="mt-1 text-rose-500" size={18} /> <span>+91 9999999999</span></div>
                <div className="flex items-start gap-3"><MapPin className="mt-1 text-rose-500" size={18} /> <span>Hyderabd, India</span></div>
              </div>
            </div>
            {/* <div className="rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-zinc-900">Frequently asked questions</h3>
              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <div className="rounded-full bg-zinc-50 px-4 py-3">Do you offer custom orders?</div>
                <div className="rounded-full bg-zinc-50 px-4 py-3">How long does shipping take?</div>
                <div className="rounded-full bg-zinc-50 px-4 py-3">Can I gift wrap my order?</div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
}
