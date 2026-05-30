import { BookOpen, AlertCircle, TrendingUp, ShieldCheck } from "lucide-react";

export default function CreatorTermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="flex items-center space-x-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(0,255,255,0.2)]">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">Creator Terms of Use</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm mt-1">Revenue Splits & Withdrawals</p>
        </div>
      </div>

      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section className="glass-card p-8 rounded-3xl space-y-4">
          <div className="flex items-center space-x-3 text-primary mb-4">
            <TrendingUp size={24} />
            <h2 className="text-2xl font-bold">1. Revenue Splits</h2>
          </div>
          <p>
            Te Rurubene operates on a transparent revenue-sharing model. When a user purchases your content (e.g., songs, albums, podcasts, merchandise, or tickets) using their prepaid wallet balance, the revenue is instantly split and allocated based on your account type:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-primary/50 transition duration-300">
              <h3 className="text-lg font-bold text-white mb-2">Independent Artists</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b border-white/10 pb-2">
                  <span>Artist Share:</span> <span className="font-bold text-green-400">90%</span>
                </li>
                <li className="flex justify-between pt-2">
                  <span>Platform Fee:</span> <span className="font-bold text-red-400">10%</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-primary/50 transition duration-300">
              <h3 className="text-lg font-bold text-white mb-2">Studio-Managed Artists</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b border-white/10 pb-2">
                  <span>Artist Share:</span> <span className="font-bold text-green-400">70%</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-2">
                  <span>Studio Share:</span> <span className="font-bold text-blue-400">20%</span>
                </li>
                <li className="flex justify-between pt-2">
                  <span>Platform Fee:</span> <span className="font-bold text-red-400">10%</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="glass-card p-8 rounded-3xl space-y-4">
          <div className="flex items-center space-x-3 text-yellow-500 mb-4">
            <AlertCircle size={24} />
            <h2 className="text-2xl font-bold text-white">2. Earnings Escrow & Availability</h2>
          </div>
          <p>
            To ensure a secure financial ecosystem and protect against fraudulent transactions, chargebacks, and refund requests, all creator earnings are subject to a standard escrow period (The 24-Hour Rule).
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li><strong className="text-white">Pending Status:</strong> Immediately upon a successful user purchase, your share of the revenue will appear in your Creator Wallet as Pending (Escrow).</li>
            <li><strong className="text-white">Release Timeline:</strong> Funds remain in the pending state for exactly <strong>24 hours</strong> from the time of the transaction.</li>
            <li><strong className="text-white">Available Status:</strong> After the 24-hour hold period expires, the funds automatically transition to Available to Withdraw status.</li>
          </ul>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-4 flex space-x-3 items-start">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">
              <strong className="text-red-400 block mb-1">Refunds & Chargebacks</strong>
              If a transaction is flagged for fraud or a valid refund is issued by administration during the 24-hour pending window, the pending earnings associated with that specific transaction will be reverted and deducted from your pending balance.
            </p>
          </div>
        </section>

        <section className="glass-card p-8 rounded-3xl space-y-4">
          <div className="flex items-center space-x-3 text-primary mb-4">
            <BookOpen size={24} />
            <h2 className="text-2xl font-bold">3. Withdrawals</h2>
          </div>
          <p>
            You may request a payout of your earnings at any time, provided the funds have cleared the escrow period and are marked as "Available."
          </p>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mt-4 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="font-bold text-white">Minimum Withdrawal</span>
              <span className="text-primary font-black text-xl">$50.00 AUD</span>
            </div>
            <div className="space-y-2 pt-2">
              <p className="text-sm"><strong>Payout Methods:</strong> Withdrawals can be processed via Bank Transfer, Mobile Money (e.g., M-PAiSA, MyCash), or PayPal, depending on your region and connected payout settings.</p>
              <p className="text-sm"><strong>Processing Times:</strong> Once requested, withdrawals are marked as "Pending" and are typically reviewed and processed by our finance team within 3-5 business days.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
