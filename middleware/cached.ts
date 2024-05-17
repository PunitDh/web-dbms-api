import { NextFunction, Request, Response } from "express";

type CacheItem = {
  data: unknown;
  expiry: number;
};

const responseCache: Record<string, CacheItem> = {};

export function cached() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const cacheKey = req.originalUrl;

    if (responseCache[cacheKey]?.expiry > Date.now()) {
      console.log("Sending cached data");
      return res.json(responseCache[cacheKey].data);
    }

    const originalSend = res.send.bind(res);

    res.send = (body: unknown): Response => {
      let dataCache;
      try {
        if (typeof body === "string") dataCache = JSON.parse(body);
      } catch {
        dataCache = body;
      }

      responseCache[cacheKey] = {
        data: dataCache,
        expiry: Date.now() + 30000,
      };

      setTimeout(() => {
        console.log("Deleting cache key", cacheKey);
        delete responseCache[cacheKey];
      }, 30000);

      return originalSend(body);
    };

    next();
  };
}
