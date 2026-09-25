import { readFile } from "node:fs/promises";
import path from "node:path";

import { StaticSite } from "@/components/static-site";

export default async function HomePage() {
  const markupPath = path.join(process.cwd(), "content", "site.html");
  const markup = (await readFile(markupPath, "utf8")).replace(/\r\n/g, "\n");

  return (
    <>
      <StaticSite markup={markup} />
      <script defer src="/site-interactions.js" />
    </>
  );
}
