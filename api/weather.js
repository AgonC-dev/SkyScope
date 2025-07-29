// /api/weather.js

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Connect Redis client with your Upstash credentials from env variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});


// Rate limiter: 10 requests per 1 minute per IP
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, '1 m'),
});

export default async function handler(req, res) {
  // Get client IP (behind proxies)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // Rate limit check
  try {
    const { success, remaining, reset } = await ratelimit.limit(ip);

    res.setHeader('X-RateLimit-Limit', 10);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    }
  } catch (err) {
    console.error('Rate limiter error:', err);
    // Optionally allow requests if rate limiter fails, or block:
    return res.status(503).json({ error: 'Rate limiter unavailable. Please try again later.' });
  }

  // Extract query params
  const { city, lat, lon, units = "metric" } = req.query;
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not set" });
  }

  let currentUrl = "";
  let forecastUrl = "";

  if (city) {
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${apiKey}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${units}&appid=${apiKey}`;
  } else if (lat && lon) {
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
  } else {
    return res.status(400).json({ error: "Missing location parameters" });
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return res.status(500).json({ error: "Failed to fetch data from OpenWeather" });
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    return res.status(200).json({ current: currentData, forecast: forecastData });
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
