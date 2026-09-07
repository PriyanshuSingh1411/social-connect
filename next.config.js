/** @type {import('next').NextConfig} */

// Content-Security-Policy is scoped to exactly what this app actually
// loads, confirmed by reading the source rather than templated:
//   - fonts.googleapis.com : globals.css @imports the "Sora" font's CSS
//     from here at runtime (separate from the Plus Jakarta Sans font,
//     which next/font/google self-hosts at build time and needs no
//     runtime allowance at all)
//   - fonts.gstatic.com    : Google's font CSS above points at this
//     second host for the actual woff2 files — CSS-src and font-src
//     both need it, or the stylesheet loads but glyphs silently don't
//   - res.cloudinary.com, avatars.githubusercontent.com : the two
//     external image domains already allow-listed in `images.domains`
//     below, for user-uploaded and GitHub-avatar profile pictures
// No 'unsafe-inline' for scripts in production — NextAuth v4's client
// flow uses fetch() for CSRF/session, not inline <script> execution,
// and Next.js's own hydration payload is a JSON script block, which
// script-src does not govern. Dev mode needs both 'unsafe-eval' and
// 'unsafe-inline' for Next.js's own Fast Refresh machinery (see the
// script-src comment below) — that relaxation never ships to
// production. style-src also skips 'unsafe-inline' in both
// environments; the handful of React style={{}} props are static
// values already converted to CSS module classes during the UI pass.
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = [
  "default-src 'self'",
  // next dev's Fast Refresh and error overlay need both 'unsafe-eval'
  // (for eval-based hot-reload code) AND 'unsafe-inline' (Next.js's
  // dev server also injects actual inline <script> elements, a
  // separate CSP concern eval-only coverage doesn't satisfy — this
  // was the gap causing "Executing inline script violates..." console
  // errors on every page in dev). Production uses neither; the
  // compiled bundle doesn't need this and never has.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://avatars.githubusercontent.com",
  isDev
  ? "connect-src 'self' ws://localhost:* ws://127.0.0.1:* https://api.cloudinary.com"
  : "connect-src 'self' https://api.cloudinary.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  // Belt-and-suspenders against clickjacking alongside frame-ancestors
  // above, for older browsers that only understand this legacy header.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // HSTS tells browsers to *refuse* future HTTP connections to this
  // host, including for anyone who already loaded the site once and
  // cached the policy. Shipping it in dev (typically plain HTTP on
  // localhost) risks locking a browser out of the dev server, so this
  // is production-only, where HTTPS is expected to actually be in
  // place.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "localhost",
      "res.cloudinary.com",
      "avatars.githubusercontent.com",
    ],
  },
  async headers() {
    return [
      {
        // Applies to every route, pages and API alike
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
