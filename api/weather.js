// api/weather.js
export default async function handler(req, res) {
    const { city, lat, lon, units = "metric" } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
  
    if (!apiKey) {
      res.status(500).json({ error: "API key not set" });
      return;
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
      res.status(400).json({ error: "Missing location parameters" });
      return;
    }
  
    try {
      const [currentRes, forecastRes] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);
  
      if (!currentRes.ok || !forecastRes.ok) {
        res.status(500).json({ error: "Failed to fetch data from OpenWeather" });
        return;
      }
  
      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();
  
      res.status(200).json({ current: currentData, forecast: forecastData });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
  