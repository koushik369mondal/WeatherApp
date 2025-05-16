const apiKey = "92386185a97a841e8c25345a7b728ec3"; // Replace with your OpenWeatherMap API key
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityName = document.querySelector('.city');
const temperature = document.querySelector('.temperature');
const weatherDescription = document.querySelector('.weather-description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const dateElement = document.querySelector('.date');
const weatherIcon = document.getElementById('weather-icon');
const forecastContainer = document.getElementById('forecast-container');
const errorMessage = document.getElementById('error-message');
const loader = document.getElementById('loader');
const locateBtn = document.getElementById('locate-btn');

// Function to format date
function formatDate(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Update current date
dateElement.textContent = formatDate(new Date());

// Function to show loader
function showLoader() {
    loader.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Function to hide loader
function hideLoader() {
    loader.style.display = 'none';
}

// Function to get weather data by city name
async function getWeatherData(city) {
    showLoader();
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);

        if (!response.ok) {
            throw new Error("City not found");
        }

        const data = await response.json();
        updateWeatherUI(data);
        getForecastData(city);
    } catch (error) {
        hideLoader();
        errorMessage.style.display = 'block';
        console.error("Error fetching weather data:", error);
    }
}

// Function to get weather data by coordinates
async function getWeatherByCoords(lat, lon) {
    showLoader();
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);

        if (!response.ok) {
            throw new Error("Weather data not available");
        }

        const data = await response.json();
        updateWeatherUI(data);
        getForecastByCoords(lat, lon);
    } catch (error) {
        hideLoader();
        errorMessage.style.display = 'block';
        console.error("Error fetching weather data:", error);
    }
}

// Function to update UI with weather data
function updateWeatherUI(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDescription.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} km/h`;

    // Set weather icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    // Hide error message if it was shown
    errorMessage.style.display = 'none';
}

// Function to get forecast data by city name
async function getForecastData(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);

        if (!response.ok) {
            throw new Error("Forecast data not available");
        }

        const data = await response.json();
        updateForecastUI(data);
    } catch (error) {
        hideLoader();
        console.error("Error fetching forecast data:", error);
    }
}

// Function to get forecast data by coordinates
async function getForecastByCoords(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);

        if (!response.ok) {
            throw new Error("Forecast data not available");
        }

        const data = await response.json();
        updateForecastUI(data);
    } catch (error) {
        hideLoader();
        console.error("Error fetching forecast data:", error);
    }
}

// Function to update forecast UI
function updateForecastUI(data) {
    // Clear previous forecast data
    forecastContainer.innerHTML = '';

    // Get forecast for the next 3 days (at noon)
    const forecastDays = {};
    const currentDate = new Date().getDate();

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.getDate();

        // Skip current day and only take data for noon (around 12:00)
        if (day !== currentDate && !forecastDays[day] && date.getHours() >= 11 && date.getHours() <= 13) {
            forecastDays[day] = item;
        }
    });

    // Take only the first 3 days
    Object.values(forecastDays).slice(0, 3).forEach(day => {
        const date = new Date(day.dt * 1000);
        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const iconCode = day.weather[0].icon;

        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';

        forecastDay.innerHTML = `
            <p class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Weather Icon" class="forecast-icon">
            <p class="forecast-temp">${temp}°C</p>
            <p class="forecast-desc">${description}</p>
        `;

        forecastContainer.appendChild(forecastDay);
    });

    hideLoader();
}

// Function to get user's location
function getUserLocation() {
    showLoader();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoords(lat, lon);
            },
            // Error callback
            (error) => {
                hideLoader();
                console.error("Geolocation error:", error);
                errorMessage.textContent = "Unable to retrieve your location. Please search for a city.";
                errorMessage.style.display = 'block';
                // Fall back to default city
                getWeatherData('Guwahati');
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        hideLoader();
        errorMessage.textContent = "Geolocation is not supported by your browser";
        errorMessage.style.display = 'block';
        // Fall back to default city
        getWeatherData('Guwahati');
    }
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

locateBtn.addEventListener('click', getUserLocation);

// On load, try to get user's location
window.addEventListener('load', () => {
    // Ask for user's location by default
    getUserLocation();
});