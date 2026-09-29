import Logo from "@/components/Logo";

export const metadata = {
  title: "Terms of Service | Silverstar",
};

export default function TermsOfServicePage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Logo />
      </div>

      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: September 2026</p>

        <p>
          These Terms of Service ("Terms") govern your use of Silverstar, an online
          marketplace operated by Silverstar Global Technologies ("Silverstar", "we",
          "us"), connecting buyers with independent vendors of printers, printer parts,
          and printing services in Nigeria. By creating an account or using Silverstar,
          you agree to these Terms.
        </p>

        <h2>1. What Silverstar Is</h2>
        <p>
          Silverstar is a marketplace platform. We connect buyers with independent
          third-party vendors who list and sell their own products and services.
          Silverstar is not the seller of record for vendor listings unless explicitly
          stated otherwise, and vendors are solely responsible for the accuracy of
          their listings, the condition of items sold, and fulfilling orders.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>You must provide accurate information when creating an account.</li>
          <li>You are responsible for keeping your password secure and for all activity under your account.</li>
          <li>Silverstar may suspend accounts that violate these Terms, engage in fraud, or harm other users.</li>
        </ul>

        <h2>3. Buying on Silverstar</h2>
        <ul>
          <li>Placing an order is an offer to purchase from the listing vendor at the stated price.</li>
          <li>Product condition (New, Refurbished, Used) is disclosed on each listing by the vendor.</li>
          <li>Delivery timelines are set by individual vendors and may vary.</li>
          <li>Payment processing is currently being finalized; where live payment is not yet available, order and payment arrangements may be confirmed directly with the vendor or Silverstar support.</li>
        </ul>

        <h2>4. Selling on Silverstar</h2>
        <ul>
          <li>Vendors must accurately describe the condition, specifications, and pricing of items listed.</li>
          <li>Vendors are responsible for fulfilling orders in a timely manner and honoring listed prices.</li>
          <li>Silverstar may require identity verification (KYC) before allowing a vendor to list products.</li>
          <li>Vendors found engaging in fraud, counterfeit sales, or repeated non-fulfillment may be suspended or removed from the platform.</li>
        </ul>

        <h2>5. Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>List or sell counterfeit, stolen, or illegal items</li>
          <li>Provide false information about yourself, your business, or a listing</li>
          <li>Use the platform to harass, defraud, or mislead other users</li>
          <li>Attempt to circumvent Silverstar's security or interfere with platform operations</li>
        </ul>

        <h2>6. Reviews</h2>
        <p>
          Reviews must reflect genuine experiences with a completed order. Silverstar
          may remove reviews that are fraudulent, abusive, or unrelated to the actual
          transaction.
        </p>

        <h2>7. Disputes Between Buyers and Vendors</h2>
        <p>
          Silverstar is not a party to the contract of sale between a buyer and a
          vendor. We encourage buyers and vendors to resolve issues directly, and
          Silverstar support may assist where reasonably possible, but we do not
          guarantee resolution of every dispute.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          Silverstar provides the platform "as is." To the fullest extent permitted by
          law, Silverstar is not liable for losses arising from transactions between
          buyers and vendors, product defects, delivery delays, or vendor conduct.
          Silverstar's total liability for any claim relating to the platform is limited
          to the amount of fees, if any, paid to Silverstar for the transaction in
          question.
        </p>

        <h2>9. Account Suspension and Termination</h2>
        <p>
          Silverstar may suspend or terminate accounts that violate these Terms, engage
          in suspicious activity, or pose a risk to other users, with or without prior
          notice where necessary to protect the platform or its users.
        </p>

        <h2>10. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of Silverstar
          after changes take effect constitutes acceptance of the updated Terms.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          Questions about these Terms can be sent to{" "}
          <a href="mailto:silverstarglobal8@gmail.com">silverstarglobal8@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
