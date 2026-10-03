export default function AccountPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-rose-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">My Account</p>
        <h1 className="mt-2 text-4xl font-semibold text-zinc-900">Welcome back to your handmade account</h1>
        <p className="mt-4 text-lg text-zinc-600">Track your orders, save favourite pieces, manage addresses, and enjoy exclusive updates.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {['Order history', 'Saved addresses', 'Wishlist', 'Reviews', 'Notifications'].map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-rose-100 bg-[#FFF8F2] p-6 text-center font-medium text-zinc-800">{item}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
