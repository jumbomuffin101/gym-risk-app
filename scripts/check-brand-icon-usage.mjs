import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = [
  "src/app/components/nav.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/exercises/page.tsx",
  "src/app/page.tsx",
];

const disallowedPatterns = [
  /src=\"\/brand\/.*\.png\"/g,
  /src=\"\/brand\/gym-risk-icon\.svg\"/g,
];

let hasError = false;

for (const file of files) {
  const text = readFileSync(resolve(file), "utf8");

  if (!text.includes("BRAND_ICON_SRC")) {
    console.error(`Missing BRAND_ICON_SRC usage in ${file}`);
    hasError = true;
  }

  for (const pattern of disallowedPatterns) {
    if (pattern.test(text)) {
      console.error(`Found disallowed logo path in ${file}: ${pattern}`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log("Brand icon usage check passed.");
