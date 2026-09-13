import type { Request, Response, NextFunction } from "express";
import { LRUCache } from "lru-cache";
import path from "path";

const defaultTTL = 1000 * 60 * 60 * 12;
const lruCache = new LRUCache({
  max: 100,
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
  ttl: defaultTTL,
});

/**
 * @param ttl minutes, default = 720
 */
export function serverCache(ttl?: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const newTTL = ttl ? 1000 * 60 * ttl : defaultTTL;
    const url = req.originalUrl || req.url || "/";
    const key = path.join(url, "/").replace(/\\/g, "/");



    const cachedData = lruCache.get(key);

    if (cachedData) {
      // console.log("hit");

      res.json(cachedData);

      return;
    }

    // console.log("miss");

    const originalJson = res.json.bind(res);

    res.json = (body: IPayload) => {
      const ongoingLen = body?.data?.ongoing?.animeList?.length || 0;
      const completedLen = body?.data?.completed?.animeList?.length || 0;
      const listLen = Array.isArray(body?.data?.animeList) ? body.data.animeList.length : -1;

      const isEmpty = (ongoingLen === 0 && completedLen === 0) || listLen === 0;

      if (res.statusCode < 399 && !isEmpty) {
        lruCache.set(key, body, { ttl: newTTL });
      }

      return originalJson(body);
    };


    next();
  };
}

/**
 * @param maxAge minutes, default = 1
 */
export function clientCache(maxAge?: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge ? maxAge * 60 : 60}`);

    next();
  };
}
