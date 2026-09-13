import otakudesuConfig from "@configs/otakudesu.config.js";
import getHTML, { userAgent } from "@helpers/getHTML.js";
import { parse, type HTMLElement } from "node-html-parser";

const { baseUrl } = otakudesuConfig;

const otakudesuScraper = {
  async scrapeDOM(pathname: string, ref?: string, sanitize: boolean = false): Promise<HTMLElement> {
    const html = await getHTML(baseUrl, pathname, ref, sanitize);
    const document = parse(html, {
      parseNoneClosedTags: true,
    });

    return document;
  },

  async scrapeNonce(body: string, referer: string): Promise<{ data?: string }> {
    try {
      const nonceResponse = await fetch(new URL("/wp-admin/admin-ajax.php", baseUrl), {
        method: "POST",
        body,
        headers: {
          "User-Agent": userAgent,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: referer,
          Origin: baseUrl,
        },
      });

      if (!nonceResponse.ok) return { data: "" };
      const nonce = (await nonceResponse.json()) as { data: string };
      return nonce;
    } catch {
      return { data: "" };
    }
  },

  async scrapeServer(body: string, referer: string): Promise<{ data?: string }> {
    try {
      const serverResponse = await fetch(new URL("/wp-admin/admin-ajax.php", baseUrl), {
        method: "POST",
        body,
        headers: {
          "User-Agent": userAgent,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Origin: baseUrl,
          Referer: referer,
        },
      });

      if (!serverResponse.ok) return { data: "" };
      const server = (await serverResponse.json()) as { data: string };
      return server;
    } catch {
      return { data: "" };
    }
  },
};

export default otakudesuScraper;

