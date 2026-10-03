"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useCartStore } from "../(components)/storefront/CartStore";
import { CartSummary } from "../(components)/storefront/components";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  pin: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
});

type CheckoutValues = z.infer<typeof schema>;
type DemoPaymentMethod = "Cash on delivery" | "Online payment (demo)";

type PostalLookupResponse = {
  Status: string;
  PostOffice: { District: string; State: string; Country: string }[] | null;
}[];

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const [step, setStep] = useState(1);
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutValues | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<DemoPaymentMethod>("Cash on delivery");
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [pinLookup, setPinLookup] = useState<"idle" | "loading" | "success" | "not-found" | "error">("idle");
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: "" },
  });
  const pin = useWatch({ control, name: "pin", defaultValue: "" });

  useEffect(() => {
    const normalizedPin = pin.replace(/\D/g, "");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      if (normalizedPin.length !== 6) {
        setPinLookup("idle");
        setValue("city", "", { shouldValidate: true });
        setValue("state", "", { shouldValidate: true });
        setValue("country", "", { shouldValidate: true });
        return;
      }

      setPinLookup("loading");
      setValue("city", "", { shouldValidate: true });
      setValue("state", "", { shouldValidate: true });
      setValue("country", "", { shouldValidate: true });

      void (async () => {
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${normalizedPin}`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`PIN lookup failed (${response.status})`);

          const result = (await response.json()) as PostalLookupResponse;
          const postOffice = result[0]?.Status === "Success" ? result[0].PostOffice?.[0] : null;
          if (!postOffice) {
            setPinLookup("not-found");
            return;
          }

          setValue("state", postOffice.State, { shouldValidate: true });
          setValue("city", postOffice.District, { shouldValidate: true });
          setValue("country", postOffice.Country, { shouldValidate: true });
          setPinLookup("success");
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error("Unable to look up the PIN code:", error);
          setPinLookup("error");
        }
      })();
    }, normalizedPin.length === 6 ? 350 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [pin, setValue]);

  const onSubmit = (values: CheckoutValues) => {
    setCheckoutDetails(values);
    setStep(2);
  };

  const goToStep = (targetStep: number) => {
    if (targetStep === 1) {
      setCheckoutComplete(false);
      setStep(1);
      return;
    }

    if (targetStep === 4) {
      if (checkoutComplete) setStep(4);
      return;
    }

    const navigate = () => {
      setCheckoutComplete(false);
      setStep(targetStep);
    };

    if (step === 1) {
      void handleSubmit((values) => {
        setCheckoutDetails(values);
        navigate();
      })();
      return;
    }

    if (checkoutDetails) navigate();
  };

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Checkout</p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-900">Delivery details</h1>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-rose-100 bg-white p-6 shadow-sm">
            {items.length === 0 ? (
              <div className="space-y-4 text-center">
                <h2 className="text-xl font-semibold text-zinc-900">Your cart is empty</h2>
                <p className="text-sm text-zinc-600">Add an item to your cart before checking out.</p>
                <Link href="/shop" className="inline-flex rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white">Continue shopping</Link>
              </div>
            ) : (
              <>
            <div className="mb-6 flex flex-wrap gap-2 text-sm font-medium text-zinc-500">
              {["Delivery", "Payment", "Review", "Done"].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => goToStep(index + 1)}
                  disabled={index === 3 && !checkoutComplete}
                  aria-current={step === index + 1 ? "step" : undefined}
                  className={`rounded-full px-4 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${
                    step === index + 1
                      ? "bg-zinc-900 text-white"
                      : index === 3 && !checkoutComplete
                        ? "cursor-not-allowed bg-zinc-100 text-zinc-400"
                        : "bg-zinc-100 hover:bg-rose-100 hover:text-zinc-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {step === 1 ? (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="pin" className="mb-2 block text-sm font-medium text-zinc-700">PIN code</label>
                  <input
                    id="pin"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    {...register("pin")}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3"
                  />
                  {errors.pin ? <p className="mt-1 text-sm text-rose-500">{errors.pin.message}</p> : null}
                  {pinLookup === "loading" ? <p className="mt-1 text-sm text-zinc-500">Looking up your location…</p> : null}
                  {pinLookup === "not-found" ? <p className="mt-1 text-sm text-rose-500">No location found for this PIN code.</p> : null}
                  {pinLookup === "error" ? <p className="mt-1 text-sm text-rose-500">Could not look up this PIN code. Check your connection and enter your location manually.</p> : null}
                  {pinLookup === "success" ? <p className="mt-1 text-sm text-emerald-700">Location added from your PIN code.</p> : null}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div><label htmlFor="state" className="mb-2 block text-sm font-medium text-zinc-700">State</label><input id="state" {...register("state")} className="w-full rounded-xl border border-zinc-300 px-4 py-3" />{errors.state ? <p className="mt-1 text-sm text-rose-500">Enter your state</p> : null}</div>
                  <div><label htmlFor="city" className="mb-2 block text-sm font-medium text-zinc-700">City / District</label><input id="city" {...register("city")} className="w-full rounded-xl border border-zinc-300 px-4 py-3" />{errors.city ? <p className="mt-1 text-sm text-rose-500">Enter your city or district</p> : null}</div>
                  <div><label htmlFor="country" className="mb-2 block text-sm font-medium text-zinc-700">Country</label><input id="country" {...register("country")} className="w-full rounded-xl border border-zinc-300 px-4 py-3" />{errors.country ? <p className="mt-1 text-sm text-rose-500">Enter your country</p> : null}</div>
                </div>
                <div>
                  <label htmlFor="address" className="mb-2 block text-sm font-medium text-zinc-700">Address</label>
                  <textarea id="address" rows={3} {...register("address")} className="w-full rounded-xl border border-zinc-300 px-4 py-3" />
                  {errors.address ? <p className="mt-1 text-sm text-rose-500">Enter an address with at least 5 characters</p> : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><label htmlFor="fullName" className="mb-2 block text-sm font-medium text-zinc-700">Full name</label><input id="fullName" autoComplete="name" {...register("fullName")} className="w-full rounded-xl border border-zinc-300 px-4 py-3" />{errors.fullName ? <p className="mt-1 text-sm text-rose-500">Enter your full name</p> : null}</div>
                  <div><label htmlFor="phone" className="mb-2 block text-sm font-medium text-zinc-700">Phone</label><input id="phone" type="tel" autoComplete="tel" {...register("phone")} className="w-full rounded-xl border border-zinc-300 px-4 py-3" />{errors.phone ? <p className="mt-1 text-sm text-rose-500">Enter a valid phone number</p> : null}</div>
                </div>
                <div><label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700">Email</label><input id="email" type="email" autoComplete="email" {...register("email")} className="w-full rounded-xl border border-zinc-300 px-4 py-3" />{errors.email ? <p className="mt-1 text-sm text-rose-500">Enter a valid email</p> : null}</div>
                <button className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white" type="submit">Continue to payment</button>
              </form>
            ) : step === 2 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Choose a payment method</h2>
                  <p className="mt-1 text-sm text-zinc-600">Demo checkout only. No payment will be processed.</p>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-4">
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "Cash on delivery"} onChange={() => setPaymentMethod("Cash on delivery")} />
                  <span className="text-sm font-medium text-zinc-800">Cash on delivery</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-4">
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "Online payment (demo)"} onChange={() => setPaymentMethod("Online payment (demo)")} />
                  <span className="text-sm font-medium text-zinc-800">Online payment (demo)</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => goToStep(1)} className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700">Back to delivery</button>
                  <button type="button" onClick={() => goToStep(3)} className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white">Review order</button>
                </div>
              </div>
            ) : step === 3 && checkoutDetails ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-rose-100 bg-[#FFF8F2] p-5">
                  <h2 className="text-lg font-semibold text-zinc-900">Delivery details</h2>
                  <p className="mt-3 text-sm text-zinc-700">{checkoutDetails.fullName}</p>
                  <p className="text-sm text-zinc-700">{checkoutDetails.address}</p>
                  <p className="text-sm text-zinc-700">{checkoutDetails.city}, {checkoutDetails.state} {checkoutDetails.pin}, {checkoutDetails.country}</p>
                  <p className="mt-2 text-sm text-zinc-600">{checkoutDetails.phone} · {checkoutDetails.email}</p>
                  <p className="mt-2 text-sm font-medium text-zinc-700">Payment: {paymentMethod}</p>
                </div>
                <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">This is a demo checkout. No payment will be collected and no order will be saved.</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => goToStep(1)} className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700">Edit delivery</button>
                  <button type="button" onClick={() => goToStep(2)} className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700">Edit payment</button>
                  <button type="button" onClick={() => { setCheckoutComplete(true); setStep(4); }} className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white">Place demo order</button>
                </div>
              </div>
            ) : step === 4 ? (
              <div className="space-y-4 text-center">
                <h2 className="text-2xl font-semibold text-zinc-900">Checkout complete</h2>
                <p className="text-sm text-zinc-600">Your demo checkout is complete. No payment was processed and no order was saved.</p>
                <Link href="/shop" className="inline-flex rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white">Continue shopping</Link>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">Enter your delivery details to continue.</p>
            )}
              </>
            )}
          </div>
          <CartSummary items={items.map((item) => ({ quantity: item.quantity, price: item.price, originalPrice: item.product.originalPrice }))} showCheckoutLink={false} />
        </div>
      </div>
    </section>
  );
}
