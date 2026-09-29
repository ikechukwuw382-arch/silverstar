import Logo from "@/components/Logo";

export const metadata = {
  title: "Privacy Policy | Silverstar",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Logo />
      </div>

      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: September 2026</p>

        <p>
          Silverstar Global Technologies ("Silverstar", "we", "us", or "our") operates
          Silverstar, an online marketplace connecting buyers with independent vendors
          of printers, printer parts, and printing services across Nigeria. This Privacy
          Policy explains what information we collect, how we use it, and the choices
          you have.
        </p>

        <h2>1. Information We Collect</h2>
        <p>When you use Silverstar, we may collect:</p>
        <ul>
          <li><strong>Account information:</strong> your name, email address, and password (stored securely as a hash, never in plain text).</li>
          <li><strong>Delivery information:</strong> phone number, state, city, address, and any delivery instructions you provide at checkout.</li>
          <li><strong>Order information:</strong> items purchased, order history, and communications related to your orders.</li>
          <li><strong>Vendor information:</strong> if you sell on Silverstar, we collect your business name, shop bio, profile picture, and any identity verification (KYC) documents required to list products.</li>
          <li><strong>Reviews:</strong> ratings and comments you leave on completed orders.</li>
        </ul>
        <p>
          We do not collect payment card details directly — payments are processed
          through licensed third-party payment providers, who handle that information
          under their own security standards.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To create and manage your account</li>
          <li>To process and fulfill orders between you and vendors</li>
          <li>To send order confirmations, status updates, and password reset emails</li>
          <li>To verify vendor identity and maintain marketplace trust and safety</li>
          <li>To respond to support requests</li>
          <li>To improve and secure the platform</li>
        </ul>

        <h2>3. Sharing Your Information</h2>
        <p>We share information only as necessary to operate the marketplace:</p>
        <ul>
          <li><strong>With vendors:</strong> your name, delivery address, and phone number are shared with the vendor fulfilling your order.</li>
          <li><strong>With service providers:</strong> we use third-party services for email delivery (Resend) and payment processing, who only receive the data needed to perform their service.</li>
          <li>We do not sell your personal information to advertisers or data brokers.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          Passwords are stored using industry-standard hashing (bcrypt) and are never
          visible to Silverstar staff. Password reset links are single-use, time-limited,
          and sent only to the email address on your account.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          You can request access to, correction of, or deletion of your personal
          information by contacting us at{" "}
          <a href="mailto:silverstarglobal8@gmail.com">silverstarglobal8@gmail.com</a>.
          We will respond within a reasonable timeframe, in line with the Nigeria Data
          Protection Regulation (NDPR).
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain account and order information for as long as your account is active,
          or as needed to comply with legal obligations, resolve disputes, and enforce
          our agreements.
        </p>

        <h2>7. Children's Privacy</h2>
        <p>
          Silverstar is not directed at children under 18. We do not knowingly collect
          personal information from minors.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be
          reflected by updating the "Last updated" date above.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          Questions about this Privacy Policy can be sent to{" "}
          <a href="mailto:silverstarglobal8@gmail.com">silverstarglobal8@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
