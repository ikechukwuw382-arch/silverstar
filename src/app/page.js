import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldIcon, SearchIcon, HandshakeIcon, TruckIcon, PrinterIcon } from "@/components/Icons";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function InkDropIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11Z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 12H1.8M22.2 12h-2.4M6.2 6.2 4.5 4.5M19.5 19.5l-1.7-1.7M6.2 17.8l-1.7 1.7M19.5 4.5l-1.7 1.7" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5l-6 6 2.4 2.4 6-6a4 4 0 0 0 5-5.4l-2.6 2.6-2-.6-.6-2 2.6-2.6Z" />
    </svg>
  );
}

function BoxStackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" />
      <path d="M3.5 8v8L12 20l8.5-4V8" />
      <path d="M12 12v8" />
    </svg>
  );
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function getCommissionRate() {
  try {
    const config = await prisma.platformConfig.findFirst();
    return config?.commissionRate ?? 3;
  } catch (e) {
    return 3;
  }
}

export default async function HomePage() {
  const commissionRate = await getCommissionRate();

  return (
    <div className="vh-page">
      <Navbar />

      {/* HERO */}
      <section className="vh-hero">
        <div className="vh-hero-inner">
          <div className="vh-eyebrow">
            <ShieldIcon /> Verified Vendors Only
          </div>
          <h1 className="vh-title">
            Nigeria&apos;s <span className="vh-title-gold">Most Trusted</span>
            <br />
            Printer Marketplace
          </h1>
          <p className="vh-lead">
            Source genuine printers and consumables, or book expert repair services —
            every vendor here has passed identity verification, so you can buy and sell
            with total confidence.
          </p>

          <div className="vh-cta-stack">
            <a href="/signup" className="vh-btn-gold">
              Get Started Free
            </a>
            <a href="/login" className="vh-btn-ghost">
              I already have an account
            </a>
          </div>
          <a href="/marketplace" className="vh-browse">
            Browse the marketplace &rarr;
          </a>
        </div>
      </section>

      {/* LEDGER STRIP */}
      <section className="vh-ledger">
        <div className="vh-ledger-grid">
          <div className="vh-ledger-cell">
            <div className="vh-ledger-num">100%</div>
            <div className="vh-ledger-label">KYC Verified</div>
          </div>
          <div className="vh-ledger-cell">
            <div className="vh-ledger-num">{commissionRate}%</div>
            <div className="vh-ledger-label">Flat Commission</div>
          </div>
          <div className="vh-ledger-cell">
            <div className="vh-ledger-num">24/7</div>
            <div className="vh-ledger-label">Marketplace Access</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="vh-section">
        <div className="vh-section-eyebrow">The Process</div>
        <h2 className="vh-section-title">How Silverstar Works</h2>
        <p className="vh-section-sub">Three simple steps to buy or sell with confidence</p>
        <div className="vh-steps">
          <div className="vh-step">
            <div className="vh-step-head">
              <span className="vh-step-no">STEP 01</span>
              <span className="vh-step-icon"><SearchIcon /></span>
            </div>
            <h3>Browse &amp; Discover</h3>
            <p>Search verified vendors for printers, consumables, and repair services near you.</p>
          </div>
          <div className="vh-step">
            <div className="vh-step-head">
              <span className="vh-step-no">STEP 02</span>
              <span className="vh-step-icon"><HandshakeIcon /></span>
            </div>
            <h3>Request a Quote</h3>
            <p>Message vendors directly, compare offers, and agree on the best price for your needs.</p>
          </div>
          <div className="vh-step">
            <div className="vh-step-head">
              <span className="vh-step-no">STEP 03</span>
              <span className="vh-step-icon"><TruckIcon /></span>
            </div>
            <h3>Buy with Confidence</h3>
            <p>Pay securely and track your order from a vendor who&apos;s already been verified.</p>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="vh-section">
        <div className="vh-section-eyebrow">The Catalogue</div>
        <h2 className="vh-section-title">Popular Categories</h2>
        <p className="vh-section-sub">Everything printer-related, in one place</p>
        <div className="vh-cats">
          <a href="/marketplace" className="vh-cat"><span className="vh-cat-icon"><PrinterIcon /></span> Printers</a>
          <a href="/marketplace" className="vh-cat"><span className="vh-cat-icon"><InkDropIcon /></span> Toner &amp; Ink</a>
          <a href="/marketplace" className="vh-cat"><span className="vh-cat-icon"><GearIcon /></span> Spare Parts</a>
          <a href="/marketplace" className="vh-cat"><span className="vh-cat-icon"><WrenchIcon /></span> Repair Services</a>
          <a href="/marketplace" className="vh-cat"><span className="vh-cat-icon"><BoxStackIcon /></span> Bulk Supplies</a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="vh-final">
        <div className="vh-final-card">
          <div className="vh-section-eyebrow" style={{ color: "#D9B26A" }}>Join Silverstar</div>
          <h2>Ready to get started?</h2>
          <p>
            Join Silverstar today — whether you&apos;re buying your next printer or growing
            your print business.
          </p>
          <a href="/signup" className="vh-btn-gold">
            Create Your Free Account
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
