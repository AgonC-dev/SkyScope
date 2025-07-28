import axios from "axios";

export default async function handler(req, res) {
  const { city, lat, lon, units } = req.query;

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  let url, params;

  if (city) {
    url = "https://api.openweathermap.org/data/2.5/weather";
    params = { q: city, units, appid: apiKey };
  } else if (lat && lon) {
    url = "https://api.openweathermap.org/data/2.5/weather";
    params = { lat, lon, units, appid: apiKey };
  } else {
    return res.status(400).json({ error: "Missing location" });
  }

  try {
    const response = await axios.get(url, { params });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
}
