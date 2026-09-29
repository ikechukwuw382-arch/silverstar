import Link from "next/link";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.97.24 2.43.4a4.9 4.9 0 0 1 1.77 1.15 4.9 4.9 0 0 1 1.15 1.77c.16.46.35 1.26.4 2.43.06 1.25.07 1.65.07 4.85s-.01 3.6-.07 4.85c-.05 1.17-.24 1.97-.4 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.46.16-1.26.35-2.43.4-1.25.06-1.65.07-4.85.07s-3.6-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.16-.46-.35-1.26-.4-2.43C2.21 15.6 2.2 15.2 2.2 12s.01-3.6.07-4.85c.05-1.17.24-1.97.4-2.43A4.9 4.9 0 0 1 3.82 3c.55-.5 1.15-.9 1.77-1.15.46-.16 1.26-.35 2.43-.4C9.27 2.21 9.67 2.2 12 2.2Zm0 1.8c-3.16 0-3.53 0-4.78.07-.96.04-1.48.2-1.82.33-.46.18-.79.4-1.14.75-.35.35-.57.68-.75 1.14-.13.34-.29.86-.33 1.82C3.11 8.86 3.1 9.23 3.1 12s0 3.14.07 4.39c.04.96.2 1.48.33 1.82.18.46.4.79.75 1.14.35.35.68.57 1.14.75.34.13.86.29 1.82.33 1.25.06 1.62.07 4.78.07s3.53 0 4.78-.07c.96-.04 1.48-.2 1.82-.33.46-.18.79-.4 1.14-.75.35-.35.57-.68.75-1.14.13-.34.29-.86.33-1.82.06-1.25.07-1.62.07-4.39s0-3.14-.07-4.39c-.04-.96-.2-1.48-.33-1.82a3.1 3.1 0 0 0-.75-1.14 3.1 3.1 0 0 0-1.14-.75c-.34-.13-.86-.29-1.82-.33-1.25-.07-1.62-.07-4.78-.07Zm0 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 1.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4Zm5.7-2a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z"/>
    </svg>
  );
}

function TikTokIcon() {
  const d = "M14.5 3h2.6c.2 1.6 1.2 3 2.6 3.7v2.6c-1-.03-1.9-.35-2.6-.86v5.15A5.35 5.35 0 1 1 11.75 8.2v2.65a2.75 2.75 0 1 0 1.9 2.61V3Z";
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d={d} fill="#25F4EE" transform="translate(-0.7,0.7)" />
      <path d={d} fill="#FE2C55" transform="translate(0.7,-0.7)" />
      <path d={d} fill="#FFFFFF" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46h1.6V4.28C16.3 4.2 15.4 4.1 14.35 4.1c-2.4 0-4.05 1.46-4.05 4.15v2.35H7.8v3h2.5V21h3.2Z"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.42 1.26 4.86L2 22l5.32-1.28a9.9 9.9 0 0 0 4.72 1.2h.01c5.5 0 9.96-4.46 9.96-9.96C21.99 6.46 17.54 2 12.04 2Zm0 18.2c-1.46 0-2.85-.4-4.06-1.13l-.29-.17-3.15.76.75-3.07-.19-.31A8.13 8.13 0 0 1 3.88 12c0-4.5 3.66-8.16 8.16-8.16S20.2 7.5 20.2 12s-3.66 8.2-8.16 8.2Zm4.5-6.1c-.25-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.77.96-.14.16-.28.18-.53.06-.25-.12-1.04-.38-1.99-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.5.11-.11.25-.28.37-.42.12-.14.16-.25.24-.4.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.76-1.8-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.31-.22.25-.85.83-.85 2.02 0 1.19.87 2.34 1 2.5.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.45-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28Z"/>
    </svg>
  );
}

const socials = [
  { name: "Instagram", href: "https://instagram.com/silverstar.88", Icon: InstagramIcon, className: "social-icon--instagram" },
  { name: "TikTok", href: "https://tiktok.com/@silverstar854", Icon: TikTokIcon, className: "social-icon--tiktok" },
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61588890583014", Icon: FacebookIcon, className: "social-icon--facebook" },
  { name: "WhatsApp", href: "https://wa.me/2348120588539", Icon: WhatsAppIcon, className: "social-icon--whatsapp" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-col footer-brand-col">
          <div className="footer-brand">Silver<span>star</span></div>
          <p className="footer-tagline">
            Nigeria&apos;s trusted printer marketplace — verified vendors, secure transactions, real support.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Marketplace</h4>
          <Link href="/marketplace">Browse Products</Link>
          <Link href="/sell">Sell on Silverstar</Link>
          <Link href="/repair-services">Repair & Services</Link>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Connect With Us</h4>
          <div className="footer-social">
            {socials.map(({ name, href, Icon, className }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className={`social-icon ${className}`}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Silverstar Global Technologies. All rights reserved.
        </p>
        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <span className="footer-dot">&middot;</span>
          <a href="/terms-of-service">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
