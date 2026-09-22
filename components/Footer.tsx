export default function Footer() {
  return (
    <footer className="border-t-[1.5px] border-rule py-8 text-[13.5px] text-soft">
      <div className="max-w-[1080px] mx-auto px-5">
        <p className="max-w-[70ch]">
          <strong className="text-ink">BrokerFreeDU never handles money.</strong> No listing
          fees, no commission, no deposits held here. We are not an agent and not a party to any
          tenancy. Verify every place in person and insist on a written rent agreement.
        </p>
        <p className="mt-2">
          Built by students, for Delhi University students. Problem with a listing or your
          number showing up here?{" "}
          <a href="mailto:hello@brokerfreedu.example" className="underline">
            Email us for a takedown
          </a>{" "}
          — actioned within 72 hours, no account needed.
        </p>
      </div>
    </footer>
  );
}
