import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per 1 minute per IP
  analytics: true,
});

export default async function handler(req, res) {
  // Extract IP — always gets first IP if there's a list
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString()
    .split(',')[0]
    .trim();

  // Limit check
  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait a minute before retrying.',
      });
    }
  } catch (err) {
    console.error('Rate limiter error:', err);
    return res.status(503).json({ error: 'Rate limiter error. Try again later.' });
  }

  const { city, lat, lon, units = 'metric' } = req.query;
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  let currentUrl = '';
  let forecastUrl = '';

  if (city) {
    const encodedCity = encodeURIComponent(city);
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&units=${units}&appid=${apiKey}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&units=${units}&appid=${apiKey}`;
  } else if (lat && lon) {
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
  } else {
    return res.status(400).json({ error: 'Missing city or coordinates.' });
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return res.status(500).json({ error: 'OpenWeather fetch failed.' });
    }

    const [currentData, forecastData] = await Promise.all([
      currentRes.json(),
      forecastRes.json(),
    ]);

    return res.status(200).json({
      current: currentData,
      forecast: forecastData,
    });
  } catch (err) {
    console.error('Weather API error:', err);
    return res.status(500).json({ error: 'Failed to fetch weather data.' });
  }
}
