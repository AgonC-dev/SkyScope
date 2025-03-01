const apiKey = '2408ae23b02c6cbe85ac54b455cb1289';
let unit = 'metric';  



document.getElementById('city').addEventListener("input", debounce(() => {
    const city = document.getElementById('city').value.trim();
    if (city) {
        getWeather(city);
    }
},900 ));

document.getElementById('search').addEventListener('click', () => {
    const city = document.getElementById('city').value.trim();
    if (city) {
        getWeather(city);
    } else {
        alert('Please enter a city name.');
    }
});

console.log(window.innerWidth, window.devicePixelRatio);
document.getElementById('city').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { 
        const city = document.getElementById('city').value.trim();
        if (city) {
            getWeather(city);
        } else { 
            alert('Please enter a city name.');
        }
    }
});



window.onload = () => {
   document.getElementById('unitToggle').disabled = true;
   document.getElementById('fahrenheitLabel').disabled = true;
   document.querySelector('.knob').style.left = "42px";
   document.getElementById('toggleContainer').style.backgroundColor = "#003D9F";
   document.getElementById('unitToggle').style.visibility = "visible";
   document.getElementById('fahrenheitLabel').style.visibility = "hidden";
}

const iconMap = {
    "Clear": "fotografi/Group 1.png",
    "Clouds": "fotografi/ret.png",
    "Partly Cloudy": "fotografi/re e dill.png",
    "Rain": "fotografi/Rain.svg",
    "Snow": "fotografi/bora.png"
}


function getWeatherIcon(description) {
    description = description.toLowerCase().trim();
    console.log("Received description:", description);
    if (description.includes("clear")) {
        console.log("Matched condition: Clear");
        return iconMap["Clear"];
    }
    if (description.includes("cloud")) {
        console.log("Matched condition: Clouds");         
        return iconMap["Clouds"];
    }
    if (description.includes("partly")) {
        console.log("Matched condition: Partly Cloudy");
        return iconMap["Partly Cloudy"];
    }
    if (description.includes("rain")) {
        console.log("Matched condition: Rain");
        return iconMap["Rain"];
    }
    if (description.includes("snow")) {
        console.log("Matched condition: Snow");
        return iconMap["Snow"];
    }
    console.log("No match found, returning default.");
    return "fotografi/Group 1.png";
}

function toggleUnit() {
 unit = unit === 'metric' ? 'imperial' : 'metric';
  
 const knob = document.querySelector('.knob');
 const toggleContainer = document.getElementById('toggleContainer');
 const toggleLabelF = document.getElementById('fahrenheitLabel');
 const toggleLabelC = document.getElementById('unitToggle');
 toggleLabelC.disabled = false;
 toggleLabelF.disabled = false;

if(unit === 'imperial') {
    knob.style.left = "0px"; 
    toggleContainer.style.backgroundColor = "#227c45fb";
    toggleLabelC.style.visibility = "hidden";
    toggleLabelF.style.visibility = "visible";
} else {
    knob.style.left ="42px";
    toggleContainer.style.background = "#003D9F";
    toggleLabelC.style.visibility = "visible";
    toggleLabelF.style.visibility = "hidden";
}


 const city = document.getElementById('city').value.trim();
 if (city) {
     getWeather(city);  
 } 
};
toggleContainer.addEventListener('click', toggleUnit);



async function getWeather(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.cod === 200) {
          document.getElementById('weather').classList.remove('hidden');
          document.getElementById('location').innerText = `${data.name}, ${data.sys.country}`;
          document.getElementById('temperature').innerText = `Temperature: ${data.main.temp}°${unit === 'metric' ? 'C' : 'F'}`;
          document.getElementById('description').innerText = `Description: ${data.weather[0].description}`;
          document.getElementById('unitToggle').disabled = false;
          document.getElementById('fahrenheitLabel').disabled = false;
          const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`;
          const forecastResponse = await fetch(forecastApiUrl);
          const forecastData = await forecastResponse.json();
          const description = data.weather[0].main; 
          console.log("Current weather description:", description);
            console.log("Matching icon:", getWeatherIcon(description));
          const iconSrc = getWeatherIcon(description);

         let forecastHTML = '<ul>';
         for (let i = 0; i <  Math.min(8, forecastData.list.length); i++) {
         let index = i * 2; // Picks index 0, 5, 10, 15, 20, 25, 30, 35
         if (index >= forecastData.list.length) break; 

    const forecast = forecastData.list[index];
    const forecastDate = new Date(forecast.dt_txt);
    const day = forecastDate.toLocaleString('en-US', { weekday: 'long' });
    const hour = forecastDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const temp = forecast.main.temp;
    const forecastMain = forecast.weather[0].main;
    const forecastIconSrc = getWeatherIcon(forecastMain);
    const forecastDescription = forecast.weather[0].description;

    forecastHTML += `<li class="forecastcycle">
                        <div class="forecast-time">
                            <span class="forecast-day">${day}</span>, <span id="forecast-hour">${hour}</span>
                        </div>
                        <div class="forecast-data">
                          <span class="forecast-description">${forecastDescription}</span>
                          <span class="forecast-temp">${temp}°<span class="forecast-unit">${unit === 'metric' ? 'C' : 'F'}</span></span>
                          <span class="img"><img class="desImg" src="${forecastIconSrc}"></span>
                        </div>
                    </li>`;
}

        forecastHTML += '</ul>'; 
        document.getElementById('forecast').innerHTML = forecastHTML;
        } else {
            alert('City not found. Please try again.');
        }
    } catch (error) {
        alert('Error fetching weather data. Please try again later.');
    }
}

async function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;
            const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;

            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                if (data.cod === 200) {
                    // Use the data directly here
                    document.getElementById('weather').classList.remove('hidden');
                    document.getElementById('location').innerText = `${data.name}, ${data.sys.country}`;
                    document.getElementById('temperature').innerText = `Temperature: ${data.main.temp}°${unit === 'metric' ? 'C' : 'F'}`;
                    document.getElementById('description').innerText = `Description: ${data.weather[0].description}`;
                    document.getElementById('unitToggle').disabled = false;
                    document.getElementById('fahrenheitLabel').disabled = false;
                

                

                const forecastResponse = await fetch(forecastApiUrl);
                const forecastData = await forecastResponse.json();
              

                let forecastHTML = '<ul>';
                for (let i = 0; i < 16; i++) {
                    const temp = forecastData.list[i].main.temp;
                    const forecastDate = new Date(forecastData.list[i].dt_txt);
                    const day = forecastDate.toLocaleString('en-US', { weekday: 'long' });
                    const forecastMain = forecastData.list[i].weather[0].main;
                    const forecastIconSrc = getWeatherIcon(forecastMain);
                    const forecastDescription = forecastData.list[i].weather[0].description;
                    const hour = forecastDate.toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true  
                    });
                    if (forecastDate.getMinutes() === 0 && forecastDate.getHours() % 6 === 0) {
                        forecastHTML += `<li class="forecastcycle">
                                    <div class="forecast-time">
                                        <span class="forecast-day">${day}</span>,<span id="forecast-hour">${hour}</span>
                                    </div>
                                    <div class="forecast-data">
                                      <span class="forecast-description">${forecastDescription}</span><span class="forecast-temp">${temp}°<span class="forecast-unit">${unit === 'metric' ? 'C' : 'F'}</span></span><span class="img"><img class="desImg
                                      "src="${forecastIconSrc}"></span>
                                    </div>
                                  
                                </li>`;
                    }
                  

                }
                forecastHTML += '</ul>';
                document.getElementById('forecast').innerHTML = forecastHTML;
            } else {
                    alert('Unable to get weather data based on your location.');
                }
            } catch (error) {
                alert('Error fetching weather data. Please try again later.');
            }
        }, (error) => {
            alert('Geolocation error: ' + error.message);
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}
document.getElementById('getLocationWeather').addEventListener('click', () => {
    getLocationWeather();
});

function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}