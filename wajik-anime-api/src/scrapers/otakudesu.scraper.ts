import getHTML, { userAgent } from "@helpers/getHTML.js";
import { parse, type HTMLElement } from "node-html-parser";

const DOMAINS = [
  "https://otakudesu.blog",
  "https://otakudesu.cloud",
  "https://otakudesu.io",
];

const otakudesuScraper = {
  async scrapeDOM(pathname: string, ref?: string, sanitize: boolean = false): Promise<HTMLElement> {
    let lastError: any;
    for (const domain of DOMAINS) {
      try {
        const html = await getHTML(domain, pathname, ref, sanitize);
        const document = parse(html, { parseNoneClosedTags: true });
        if (document && document.querySelector("h1, .infozingle, .venutama, ul")) {
          return document;
        }
      } catch (err: any) {
        lastError = err;
      }
    }
    throw lastError || { status: 404, message: "Data not found across Otakudesu mirrors" };
  },

  async scrapeNonce(body: string, referer: string): Promise<{ data?: string }> {
    for (const domain of DOMAINS) {
      try {
        const nonceResponse = await fetch(new URL("/wp-admin/admin-ajax.php", domain), {
          method: "POST",
          body,
          headers: {
            "User-Agent": userAgent,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Referer: referer,
            Origin: domain,
          },
        });

        if (nonceResponse.ok) {
          const nonce = (await nonceResponse.json()) as { data: string };
          if (nonce?.data) return nonce;
        }
      } catch {
        continue;
      }
    }
    return { data: "" };
  },

  async scrapeServer(body: string, referer: string): Promise<{ data?: string }> {
    for (const domain of DOMAINS) {
      try {
        const serverResponse = await fetch(new URL("/wp-admin/admin-ajax.php", domain), {
          method: "POST",
          body,
          headers: {
            "User-Agent": userAgent,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Origin: domain,
            Referer: referer,
          },
        });

        if (serverResponse.ok) {
          const server = (await serverResponse.json()) as { data: string };
          if (server?.data) return server;
        }
      } catch {
        continue;
      }
    }
    return { data: "" };
  },
};

export default otakudesuScraper;


