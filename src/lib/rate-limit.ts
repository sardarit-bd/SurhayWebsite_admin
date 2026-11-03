import { RateLimiterMemory } from "rate-limiter-flexible";

// 10 requests per minute per IP
export const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});
