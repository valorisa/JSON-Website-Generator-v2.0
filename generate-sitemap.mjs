/**
 * generate-sitemap.mjs
 * JSON Website Generator v2.0 — Sitemap Generator
 *
 * Reads a master_blueprint JSON file and outputs a valid sitemap.xml
 * compliant with the Sitemaps Protocol 0.9 (https://www.sitemaps.org/protocol.html)
 * and Google's sitemap guidelines.
 *
 * Usage:
 *   node generate-sitemap.mjs --blueprint ./blueprint.json --domain https://example.com
 *
 * Optional flags:
 *   --output ./public/sitemap.xml   (default: ./sitemap.xml)
 *   --pretty                        (pretty-print XML, default: true)
 *
 * Zero external dependencies. Runs on Node.js 18+.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { parseArgs } from "util";

// ─── CLI argument parsing ─────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    blueprint: { type: "string", default: "./blueprint.json" },
    domain:    { type: "string", default: "" },
    output:    { type: "string", default: "./sitemap.xml" },
    pretty:    { type: "boolean", default: true },
  },
  strict: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sanitize and normalize a domain string.
 * Ensures no trailing slash and enforces https.
 */
function normalizeDomain(domain) {
  if (!domain) return null;
  let d = domain.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(d)) d = "https://" + d;
  return d;
}

/**
 * Extract the base domain from a canonical URL string like "https://{{DOMAIN}}/about"
 * or a real URL. Returns null if the domain is still a placeholder.
 */
function extractDomainFromCanonical(canonical) {
  if (!canonical || canonical.includes("{{")) return null;
  try {
    const url = new URL(canonical);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/**
 * Escape special XML characters in attribute values and text content.
 */
function xmlEscape(str) {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;");
}

/**
 * Map a robots directive to a changefreq hint.
 * Falls back to "monthly" if unknown.
 */
function routeToChangefreq(route) {
  if (route === "/")                          return "weekly";
  if (route.startsWith("/blog") ||
      route.startsWith("/resources") ||
      route.startsWith("/guides"))            return "weekly";
  if (route.startsWith("/legal"))             return "yearly";
  if (route.startsWith("/contact"))           return "monthly";
  return "monthly";
}

/**
 * Map a route to a priority score (0.0 – 1.0).
 * Home is always 1.0. Legal pages are 0.3.
 */
function routeToPriority(route) {
  if (route === "/")                          return "1.0";
  if (route.startsWith("/legal"))             return "0.3";
  if (route.startsWith("/blog") ||
      route.startsWith("/resources") ||
      route.startsWith("/guides"))            return "0.7";
  return "0.8";
}

/**
 * Build a full absolute URL from a domain + route.
 * Handles routes that are already full URLs (pass-through).
 */
function buildUrl(domain, route) {
  if (/^https?:\/\//i.test(route)) return route;
  return `${domain}${route === "/" ? "" : route}`;
}

/**
 * Today's date in W3C Datetime format (YYYY-MM-DD), used as <lastmod>.
 */
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ─── Blueprint loader ─────────────────────────────────────────────────────────

function loadBlueprint(blueprintPath) {
  const abs = resolve(process.cwd(), blueprintPath);
  try {
    const raw = readFileSync(abs, "utf-8");
    const parsed = JSON.parse(raw);
    // Support both { master_blueprint: {...} } and the inner object directly
    return parsed.master_blueprint ?? parsed;
  } catch (err) {
    console.error(`\n❌  Cannot read blueprint at "${abs}"\n    ${err.message}\n`);
    process.exit(1);
  }
}

// ─── URL entry builder ────────────────────────────────────────────────────────

/**
 * Build the list of <url> entries from site_structure.
 * Each entry contains:
 *   - <loc>       absolute URL
 *   - <lastmod>   today's date (can be overridden per page if blueprint has date)
 *   - <changefreq>
 *   - <priority>
 *   - <xhtml:link> alternate entries for each hreflang (if present)
 *
 * Excluded automatically:
 *   - Routes where robots directive is "noindex" or contains "noindex"
 *   - Routes that are still placeholders (contain "{{")
 *   - /legal/* pages (configurable below)
 */
function buildUrlEntries(blueprint, domain) {
  const pages = blueprint.site_structure ?? [];
  const today = todayISO();
  const entries = [];

  // Option: set to false to include /legal pages in the sitemap
  const EXCLUDE_LEGAL = true;

  for (const page of pages) {
    const route = page.route ?? "";

    // Skip placeholder routes
    if (route.includes("{{")) {
      console.warn(`  ⚠  Skipped placeholder route: "${route}"`);
      continue;
    }

    // Skip noindex pages
    const robots = page.seo?.robots ?? "index, follow";
    if (/noindex/i.test(robots)) {
      console.warn(`  ⚠  Skipped noindex route: "${route}"`);
      continue;
    }

    // Skip legal pages (optional)
    if (EXCLUDE_LEGAL && route.startsWith("/legal")) {
      console.info(`  ℹ  Skipped legal route: "${route}"`);
      continue;
    }

    // Resolve canonical: use blueprint canonical if real, else build from domain
    let canonicalBase = null;
    if (page.seo?.canonical && !page.seo.canonical.includes("{{")) {
      canonicalBase = extractDomainFromCanonical(page.seo.canonical) ?? domain;
    } else {
      canonicalBase = domain;
    }

    const loc = buildUrl(canonicalBase, route);

    // Hreflang alternates
    const hreflangEntries = (page.seo?.hreflang ?? []).filter(
      (h) => h.lang && h.url && !h.url.includes("{{")
    );

    entries.push({
      loc,
      lastmod: today,
      changefreq: routeToChangefreq(route),
      priority: routeToPriority(route),
      hreflang: hreflangEntries,
    });
  }

  return entries;
}

// ─── XML builder ─────────────────────────────────────────────────────────────

function buildXml(entries, pretty = true) {
  const indent = pretty ? "  " : "";
  const nl     = pretty ? "\n" : "";
  const hasHreflang = entries.some((e) => e.hreflang.length > 0);

  const xmlnsHreflang = hasHreflang
    ? `\n  xmlns:xhtml="http://www.w3.org/1999/xhtml"`
    : "";

  const urlBlocks = entries.map((entry) => {
    const hreflangLines = entry.hreflang
      .map(
        (h) =>
          `${indent}${indent}<xhtml:link${nl}` +
          `${indent}${indent}  rel="alternate"${nl}` +
          `${indent}${indent}  hreflang="${xmlEscape(h.lang)}"${nl}` +
          `${indent}${indent}  href="${xmlEscape(h.url)}"/>`
      )
      .join(nl);

    return [
      `${indent}<url>`,
      `${indent}${indent}<loc>${xmlEscape(entry.loc)}</loc>`,
      `${indent}${indent}<lastmod>${entry.lastmod}</lastmod>`,
      `${indent}${indent}<changefreq>${entry.changefreq}</changefreq>`,
      `${indent}${indent}<priority>${entry.priority}</priority>`,
      ...(hreflangLines ? [hreflangLines] : []),
      `${indent}</url>`,
    ].join(nl);
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset`,
    `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xmlnsHreflang}`,
    `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
    `  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9`,
    `    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`,
    ...(pretty ? [""] : []),
    urlBlocks.join(nl + nl),
    ...(pretty ? [""] : []),
    `</urlset>`,
  ].join(nl);
}

// ─── Writer ───────────────────────────────────────────────────────────────────

function writeOutput(outputPath, content) {
  const abs = resolve(process.cwd(), outputPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf-8");
  return abs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("\n🗺️  JSON Website Generator v2.0 — Sitemap Generator\n");

  // 1. Load blueprint
  console.log(`📂  Loading blueprint: ${args.blueprint}`);
  const blueprint = loadBlueprint(args.blueprint);

  // 2. Resolve domain
  let domain =
    normalizeDomain(args.domain) ||
    normalizeDomain(blueprint.meta?.domain) ||
    extractDomainFromCanonical(
      blueprint.site_structure?.[0]?.seo?.canonical ?? ""
    );

  if (!domain) {
    console.error(
      "\n❌  Domain could not be resolved.\n" +
      "    Pass it explicitly: --domain https://example.com\n" +
      "    Or set a real canonical URL in your blueprint's first route.\n"
    );
    process.exit(1);
  }

  console.log(`🌐  Domain: ${domain}`);

  // 3. Build URL entries
  console.log(`\n📄  Processing routes from site_structure:`);
  const entries = buildUrlEntries(blueprint, domain);

  if (entries.length === 0) {
    console.error(
      "\n❌  No valid URL entries found.\n" +
      "    Check that your blueprint has a 'site_structure' array\n" +
      "    with non-placeholder routes and no 'noindex' robots directives.\n"
    );
    process.exit(1);
  }

  console.log(`\n✅  ${entries.length} URL(s) will be included in the sitemap:`);
  entries.forEach((e) => console.log(`     ${e.priority}  ${e.loc}`));

  // 4. Build XML
  const xml = buildXml(entries, args.pretty);

  // 5. Write output
  const writtenTo = writeOutput(args.output, xml);
  console.log(`\n✨  sitemap.xml written to: ${writtenTo}`);

  // 6. Summary
  console.log(`\n📊  Summary:`);
  console.log(`     URLs included  : ${entries.length}`);
  console.log(`     Hreflang used  : ${entries.some((e) => e.hreflang.length > 0) ? "yes" : "no"}`);
  console.log(`     Output format  : ${args.pretty ? "pretty-printed XML" : "minified XML"}`);
  console.log(`     Standard       : Sitemaps Protocol 0.9\n`);
}

main();
