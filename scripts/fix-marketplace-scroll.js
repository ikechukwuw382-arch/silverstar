const fs = require('fs');
const path = process.argv[2];

if (!path) {
  console.error('Usage: node fix-marketplace-scroll.js <path-to-marketplace-page.js>');
  process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// --- Fix 1: remember scroll position, restore it after add-to-cart finishes ---
const fnAnchor = 'async function handleAddToCart(listingId) {';
const fnReplacement = `async function handleAddToCart(listingId) {
    const savedY = window.scrollY;
    try {
      await handleAddToCartInner(listingId);
    } finally {
      requestAnimationFrame(() => window.scrollTo(0, savedY));
      setTimeout(() => window.scrollTo(0, savedY), 100);
    }
  }

  async function handleAddToCartInner(listingId) {`;

if (!content.includes(fnAnchor)) {
  console.error('Could not find handleAddToCart. Nothing changed.');
  process.exit(1);
}
if (content.includes('handleAddToCartInner')) {
  console.log('Scroll fix already present - skipping that part.');
} else {
  content = content.replace(fnAnchor, fnReplacement);
}

// --- Fix 2: make the Add to Cart button an explicit non-submit button ---
const btnAnchor = 'className="btn product-cta"';
if (!content.includes(btnAnchor)) {
  console.error('Could not find the Add to Cart button. Nothing changed.');
  process.exit(1);
}
if (content.includes('type="button"\n              className="btn product-cta"') || content.includes('type="button" className="btn product-cta"')) {
  console.log('Button type already set - skipping that part.');
} else {
  content = content.split(btnAnchor).join('type="button" ' + btnAnchor);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done: marketplace scroll fix applied to ' + path);
