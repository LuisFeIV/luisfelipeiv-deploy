import { readFile } from "node:fs/promises";
import path from "node:path";
import Script from "next/script";

import { StaticSite } from "@/components/static-site";
import { listPublicSiteContent } from "@/lib/db/site-content";
import { renderSiteMedia } from "@/lib/render-site-media";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const markupPath = path.join(process.cwd(), "content", "site.html");
  const source = (await readFile(markupPath, "utf8")).replace(/\r\n/g, "\n");
  const content = await listPublicSiteContent();
  const markup = renderSiteMedia(source, content);

  return (
    <>
      <StaticSite markup={markup} />
      <Script src="https://f.convertkit.com/ckjs/ck.5.js" strategy="afterInteractive" />
      <Script src="/site-interactions.js" strategy="afterInteractive" />
    </>
  );
}
