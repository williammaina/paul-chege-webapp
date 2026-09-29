import fs from 'node:fs';
import * as esbuild from 'esbuild';

const src = fs.readFileSync('src/PaulChegeConsultancyTV.jsx', 'utf8');

// 1. pull out the lucide icon names, then strip all imports
const lucideBlock = src.match(/import\s*\{([\s\S]*?)\}\s*from\s*"lucide-react";/);
const icons = lucideBlock[1].split(',').map(s => s.trim()).filter(Boolean);

let body = src
  .replace(/^import[\s\S]*?from\s*"lucide-react";\n/m, '')
  .replace(/^import[\s\S]*?from\s*"react";\n/m, '')
  .replace(/export default function/, 'function')
  // Tailwind v4 font syntax -> plain utility class for the v3 Play CDN
  .replace(/font-\[family-name:var\(--font-display\)\]/g, 'font-display');

const shim = `
const { useState, useMemo, useEffect, useRef, useCallback } = React;
function makeIcon(name) {
  const C = ({ size = 24, className = "", strokeWidth = 2, style, ...rest }) => {
    const node = (window.lucide && (window.lucide.icons?.[name] || window.lucide[name])) || null;
    const kids = (node && Array.isArray(node[2]) ? node[2] : []).map(([tag, attrs], i) =>
      React.createElement(tag, Object.assign({ key: i }, attrs)));
    return React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': strokeWidth,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', className, style, ...rest,
    }, kids);
  };
  C.displayName = name;
  return C;
}
${icons.map(n => `const ${n} = makeIcon("${n}");`).join('\n')}
`;

const { code } = await esbuild.transform(shim + body, {
  loader: 'jsx', jsx: 'transform', target: 'es2019',
});

// 2. CSS: reuse the project stylesheet minus the Tailwind v4 directives
let css = fs.readFileSync('src/index.css', 'utf8')
  .replace(/@import\s+"tailwindcss";\n/, '')
  .replace(/@theme\s*\{[\s\S]*?\n\}\n/, '');

const vars = `
:root {
  --font-display: "Sora", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}
.font-display { font-family: var(--font-display); }
.font-sans { font-family: var(--font-sans); }
body { font-family: var(--font-sans); }
.tabular-nums { font-variant-numeric: tabular-nums; }
`;

const html = `<!doctype html>
<html lang="en-KE">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Paul Chege Consultancy TV — Demystifying Insurance &amp; Smart Leverage</title>
<meta name="description" content="Insurance brokerage, debt coaching and claims advocacy with Paul Chege. Author of The Anatomy of Smart Borrowing." />
<link rel="icon" type="image/png" href="/img/favicon.png?v=2" />
<link rel="apple-touch-icon" href="/img/favicon.png?v=2" />
<meta name="author" content="Paul Chege" />
    <meta name="theme-color" content="#0A1128" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="geo.region" content="KE-30" />
    <meta name="geo.placename" content="Nairobi" />
    <link rel="preconnect" href="https://i.ytimg.com" crossorigin />
    <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
    <link rel="preload" as="image" href="/img/paul-cutout.webp" fetchpriority="high" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400..800&family=Plus+Jakarta+Sans:wght@300..800&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin></script>
<script src="https://unpkg.com/lucide@0.462.0/dist/umd/lucide.js"></script>
<style>
${vars}
${css}
</style>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Person",
          "@id": "https://paulchege.co.ke/#paul",
          "name": "Paul Chege",
          "jobTitle": "Insurance Broker, Financial Coach and Author",
          "description": "Financial advisor, banking professional and financial literacy advocate. Author of The Anatomy of Smart Borrowing.",
          "image": "/img/paul-chege.webp",
          "worksFor": { "@id": "https://paulchege.co.ke/#org" },
          "alumniOf": { "@type": "CollegeOrUniversity", "name": "KCA University" },
          "sameAs": [
            "https://www.tiktok.com/@paulchegetv",
            "https://www.facebook.com/paulchegeconsultancyTv",
            "https://www.youtube.com/@paulchege91",
            "https://www.instagram.com/paul.chege.7739"
          ]
        },
        {
          "@type": "ProfessionalService",
          "@id": "https://paulchege.co.ke/#org",
          "name": "Paul Chege Consultancy TV",
          "slogan": "Demystifying Insurance & Smart Leverage",
          "description": "Insurance brokerage, debt and borrowing coaching, and claims advocacy for Kenyan households and businesses.",
          "logo": "/img/logo.webp",
          "founder": { "@id": "https://paulchege.co.ke/#paul" },
          "telephone": "+254710890994",
          "email": "info@bizsure.co.ke",
          "areaServed": "KE",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Ciata City Mall, Block A, 2nd Floor, Ridgeways, Kiambu Road",
            "addressLocality": "Nairobi",
            "addressCountry": "KE"
          },
          "openingHours": "Mo-Fr 08:00-17:00",
          "sameAs": [
            "https://www.tiktok.com/@paulchegetv",
            "https://www.facebook.com/paulchegeconsultancyTv",
            "https://www.youtube.com/@paulchege91",
            "https://www.instagram.com/paul.chege.7739"
          ]
        },
        {
          "@type": "Book",
          "name": "The Anatomy of Smart Borrowing",
          "alternativeHeadline": "Understanding loans before you engage",
          "author": { "@id": "https://paulchege.co.ke/#paul" },
          "isbn": "978-9914-9204-1-3",
          "inLanguage": "en",
          "datePublished": "2026-09-25",
          "offers": [
            { "@type": "Offer", "price": "1999", "priceCurrency": "KES", "name": "Physical copy", "availability": "https://schema.org/InStock" },
            { "@type": "Offer", "price": "999", "priceCurrency": "KES", "name": "eBook (PDF)", "availability": "https://schema.org/InStock" }
          ]
        }
      ]
    }
    </script>
</head>
<body>
<script>
      try {
        var t = localStorage.getItem('pc-theme');
        if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', t);
      } catch (e) {}
    </script>
<script src="/config.js"></script>
    <div id="root"></div>
<script>
${code}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(PaulChegeConsultancyTV));
</script>
</body>
</html>
`;

fs.writeFileSync('public/prototype.html', html);
console.log('wrote public/prototype.html', (html.length / 1024).toFixed(0) + 'KB,', icons.length, 'icons');
