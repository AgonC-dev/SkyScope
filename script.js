
let unit = "metric";
let isUsingGeoLocation = false;
let lastSearchedCity = "";

const cityInput = document.getElementById("city");
const weatherDiv = document.getElementById("weather");
const locationElem = document.getElementById("location");
const temperatureElem = document.getElementById("temperature");
const descriptionElem = document.getElementById("description");
const forecastContainer = document.getElementById("forecast");
const unitToggle = document.getElementById("unitToggle");
const fahrenheitLabel = document.getElementById("fahrenheitLabel");
const toggleContainer = document.getElementById("toggleContainer");
const knob = document.querySelector(".knob");

const iconMap = {
  Clear: "fotografi/Group 1.png",
  Clouds: "fotografi/ret.png",
  "Partly Cloudy": "fotografi/re e dill.png",
  Rain: "fotografi/Rain.svg",
  Snow: "fotografi/bora.png",
};

function getWeatherIcon(description) {
  description = description.toLowerCase().trim();
  if (description.includes("clear")) return iconMap["Clear"];
  if (description.includes("cloud")) return iconMap["Clouds"];
  if (description.includes("partly")) return iconMap["Partly Cloudy"];
  if (description.includes("rain")) return iconMap["Rain"];
  if (description.includes("snow")) return iconMap["Snow"];
  return iconMap["Clear"];
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

window.onload = () => {
  unitToggle.disabled = true;
  fahrenheitLabel.disabled = true;
  knob.style.left = "42px";
  toggleContainer.style.backgroundColor = "#003D9F";
  unitToggle.style.visibility = "visible";
  fahrenheitLabel.style.visibility = "hidden";
};

toggleContainer.addEventListener("click", toggleUnit);
document.getElementById("getLocationWeather").addEventListener("click", getLocationWeather);
document.getElementById("search").addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
  else alert("Please enter a city name.");
});


cityInput.addEventListener("input", function () {
  this.style.color = "";
});

cityInput.addEventListener(
  "input",
  debounce(() => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
  }, 700)
);

function toggleUnit() {
  unit = unit === "metric" ? "imperial" : "metric";
  unitToggle.disabled = false;
  fahrenheitLabel.disabled = false;

  if (unit === "imperial") {
    knob.style.left = "0px";
    toggleContainer.style.backgroundColor = "#227c45fb";
    unitToggle.style.visibility = "hidden";
    fahrenheitLabel.style.visibility = "visible";
  } else {
    knob.style.left = "42px";
    toggleContainer.style.backgroundColor = "#003D9F";
    unitToggle.style.visibility = "visible";
    fahrenheitLabel.style.visibility = "hidden";
  }

  if (isUsingGeoLocation) {
    getLocationWeather();
  } else if (lastSearchedCity) {
    getWeather(lastSearchedCity);
  }
}

async function getWeather(city) {
  isUsingGeoLocation = false;
  lastSearchedCity = city;
  cityInput.style.color = "";

  const apiUrl = `/api/weather?city=${encodeURIComponent(city)}&units=${unit}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (response.status !== 200) {
      cityInput.style.color = "red";
      cityInput.value = data.error || "Error fetching weather";
      return;
    }

    const current = data.current;
    const forecastData = data.forecast;

    weatherDiv.classList.remove("hidden");
    locationElem.textContent = `${current.name}, ${current.sys.country}`;
    temperatureElem.textContent = `Temperature: ${Math.round(current.main.temp)}°${unit === "metric" ? "C" : "F"}`;
    descriptionElem.textContent = `Description: ${current.weather[0].description}`;
    unitToggle.disabled = false;
    fahrenheitLabel.disabled = false;

    setTimeout(() => {
      weatherDiv.scrollIntoView({ behavior: "smooth" });
    }, 200);

    renderForecast(forecastData.list);
  } catch (error) {
    alert("Server is down. Please try again later!");
  }
}



function renderForecast(forecastList) {
  forecastContainer.innerHTML = "";
  const ul = document.createElement("ul");

  for (let i = 0; i < Math.min(8, forecastList.length); i++) {
    let index = i * 2;
    if (index >= forecastList.length) break;

    const forecast = forecastList[index];
    const forecastDate = new Date(forecast.dt_txt);
    const day = forecastDate.toLocaleString("en-US", { weekday: "long" });
    const hour = forecastDate.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const temp = Math.round(forecast.main.temp);
    const forecastMain = forecast.weather[0].main;
    const forecastDescription = forecast.weather[0].description;
    const forecastIconSrc = getWeatherIcon(forecastMain);

    const li = document.createElement("li");
    li.className = "forecastcycle";
    li.innerHTML = `
      <div class="forecast-time">
        <span class="forecast-day">${day}</span>, <span id="forecast-hour">${hour}</span>
      </div>
      <div class="forecast-data">
        <span class="forecast-description">${forecastDescription}</span>
        <span class="forecast-temp">${temp}°<span class="forecast-unit">${
      unit === "metric" ? "C" : "F"
    }</span></span>
        <span class="img"><img class="desImg" src="${forecastIconSrc}" alt="weather icon" loading="lazy" decoding="async"></span>
      </div>`;
    ul.appendChild(li);
  }

  forecastContainer.appendChild(ul);
}

async function getLocationWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      isUsingGeoLocation = true;
      lastSearchedCity = "";

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const apiUrl = `/api/weather?lat=${lat}&lon=${lon}&units=${unit}`;

      try {
        const response = await fetch(apiUrl, { cache: "no-store" });
        
        // Check HTTP status first
        if (response.status !== 200) {
          alert("Unable to get weather data based on your location.");
          return;
        }
        
        const data = await response.json();
        const current = data.current; // Access current weather data
        const forecastData = data.forecast;

        cityInput.value = current.name; // Use current.name instead of data.name
        weatherDiv.classList.remove("hidden");
        locationElem.textContent = `${current.name}, ${current.sys.country}`;
        temperatureElem.textContent = `Temperature: ${Math.round(
          current.main.temp // Use current.main.temp
        )}°${unit === "metric" ? "C" : "F"}`;
        descriptionElem.textContent = `Description: ${current.weather[0].description}`;
        
        renderForecast(forecastData.list);

        setTimeout(() => {
          weatherDiv.scrollIntoView({ behavior: "smooth" });
        }, 200);
        // ... rest of the code ...
      } catch {
        alert("Error fetching weather data. Please try again later.");
      }
    },
    (error) => {
      alert("Geolocation error: " + error.message);
    }
  );
}