const apiKey = "92386185a97a841e8c25345a7b728ec3"; // Replace with your OpenWeatherMap API key

// DOM Elements
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const cityName = document.querySelector(".city");
const temperature = document.querySelector(".temperature");
const weatherDescription = document.querySelector(".weather-description");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const dateElement = document.querySelector(".date");
const weatherIcon = document.getElementById("weather-icon");
const forecastContainer = document.getElementById("forecast-container");
const errorMessage = document.getElementById("error-message");
const loader = document.getElementById("loader");
const locateBtn = document.getElementById("locate-btn");

// Enhanced features from first script
const latInput = document.getElementById("lat-input");
const lonInput = document.getElementById("lon-input");
const coordsSearchBtn = document.getElementById("coords-search-btn");
const showCoordsBtn = document.getElementById("show-coords-btn");
const unitToggle = document.getElementById("unit-toggle");
const refreshBtn = document.getElementById("refresh-btn");

// State variables
let currentLat = null;
let currentLon = null;
let currentWeatherData = null;
let currentForecastData = null;
let currentUnit = "metric"; // Default to metric (Celsius)
let currentQuery = null; // Store last successful query

// Utility Functions
function formatDate(date) {
    const options = {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
}

function convertTemperature(temp, toUnit) {
    if (toUnit === "imperial") {
        return (temp * 9 / 5) + 32;
    } else {
        return (temp - 32) * 5 / 9;
    }
}

function convertWindSpeed(speed, toUnit) {
    if (toUnit === "imperial") {
        return speed * 0.621371; // m/s to mph
    } else {
        return speed / 0.621371; // mph to m/s
    }
}

function validateCoordinates(lat, lon) {
    if (isNaN(lat) || isNaN(lon)) {
        showError("Coordinates must be valid numbers");
        return false;
    }
    if (lat < -90 || lat > 90) {
        showError("Latitude must be between -90 and 90 degrees");
        return false;
    }
    if (lon < -180 || lon > 180) {
        showError("Longitude must be between -180 and 180 degrees");
        return false;
    }
    return true;
}

// UI Functions
function showLoader() {
    if (loader) loader.style.display = "block";
    if (errorMessage) errorMessage.style.display = "none";
}

function hideLoader() {
    if (loader) loader.style.display = "none";
}

function showError(message) {
    hideLoader();
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";

        // Add shake animation if available
        errorMessage.classList.add("shake");
        setTimeout(() => {
            errorMessage.classList.remove("shake");
        }, 500);

        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = "none";
        }, 5000);
    }
    console.error("Weather App Error:", message);
}

// Enhanced input parsing function
function parseSearchInput(input) {
    const trimmedInput = input.trim();

    // Check for coordinates (lat,lon format)
    if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(trimmedInput)) {
        const [lat, lon] = trimmedInput.split(",").map(val => parseFloat(val.trim()));
        if (validateCoordinates(lat, lon)) {
            return { type: 'coords', lat, lon };
        }
        return null;
    }

    // Check for Indian PIN code (5-6 digits)
    if (/^\d{5,6}$/.test(trimmedInput)) {
        return { type: 'zip', query: `zip=${trimmedInput},IN` };
    }

    // Check for international postal code with country
    if (/^\d{5}\s*,\s*[A-Z]{2}$/i.test(trimmedInput)) {
        const [zip, country] = trimmedInput.split(",").map(s => s.trim());
        return { type: 'zip', query: `zip=${zip},${country.toUpperCase()}` };
    }

    // Default to city search
    return { type: 'city', query: `q=${encodeURIComponent(trimmedInput)}` };
}

// Weather API Functions
async function fetchWeatherData(url, errorContext) {
    try {
        const response = await fetch(url);

        if (response.status === 404) {
            throw new Error("Location not found. Please check your input and try again.");
        } else if (response.status === 401) {
            throw new Error("API key error. Please check your configuration.");
        } else if (response.status === 429) {
            throw new Error("Too many requests. Please wait a moment and try again.");
        } else if (!response.ok) {
            throw new Error(`Weather service error (${response.status}). Please try again later.`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error("Network error. Please check your internet connection.");
        }
        throw error;
    }
}

async function getWeatherByQuery(queryString) {
    showLoader();
    try {
        currentQuery = queryString;

        // Fetch current weather
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?${queryString}&units=${currentUnit}&appid=${apiKey}`;
        const currentData = await fetchWeatherData(currentUrl, "current weather");

        currentWeatherData = currentData;
        updateWeatherUI(currentData);

        // Fetch forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${queryString}&units=${currentUnit}&appid=${apiKey}`;
        const forecastData = await fetchWeatherData(forecastUrl, "forecast");

        currentForecastData = forecastData;
        updateForecastUI(forecastData);

        // Store successful search
        if (queryString.startsWith('q=')) {
            const cityName = queryString.replace('q=', '');
            localStorage.setItem("lastCity", decodeURIComponent(cityName));
        }

        // Clear error message
        if (errorMessage) errorMessage.style.display = "none";

    } catch (error) {
        showError(error.message || "Failed to fetch weather data. Please try again.");
    }
}

async function getWeatherByCoords(lat, lon) {
    showLoader();
    try {
        currentLat = lat;
        currentLon = lon;

        // Fetch current weather
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`;
        const currentData = await fetchWeatherData(currentUrl, "current weather");

        currentWeatherData = currentData;
        updateWeatherUI(currentData);

        // Fetch forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`;
        const forecastData = await fetchWeatherData(forecastUrl, "forecast");

        currentForecastData = forecastData;
        updateForecastUI(forecastData);

        // Store successful coordinates
        localStorage.setItem("lastLat", lat.toString());
        localStorage.setItem("lastLon", lon.toString());

        // Clear error message
        if (errorMessage) errorMessage.style.display = "none";

    } catch (error) {
        showError(error.message || "Failed to fetch weather data. Please try again.");
    }
}

// UI Update Functions
function updateWeatherUI(data) {
    try {
        // Update location display
        let locationText = `${data.name}, ${data.sys.country}`;
        if (currentLat !== null && currentLon !== null) {
            locationText += ` (${currentLat.toFixed(4)}, ${currentLon.toFixed(4)})`;
        }
        if (cityName) cityName.textContent = locationText;

        // Update temperature
        const tempUnit = currentUnit === "metric" ? "°C" : "°F";
        if (temperature) temperature.textContent = `${Math.round(data.main.temp)}${tempUnit}`;

        // Update weather description
        if (weatherDescription) {
            weatherDescription.textContent = data.weather[0]?.description || "Unknown";
        }

        // Update humidity
        if (humidity) humidity.textContent = `${data.main.humidity}%`;

        // Update wind speed
        const windUnit = currentUnit === "metric" ? "m/s" : "mph";
        if (windSpeed) windSpeed.textContent = `${data.wind.speed.toFixed(1)} ${windUnit}`;

        // Update weather icon
        if (weatherIcon) {
            const iconCode = data.weather[0]?.icon || "50d";
            weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            weatherIcon.alt = data.weather[0]?.description || "Weather icon";
            weatherIcon.onerror = function () {
                this.alt = "Weather icon unavailable";
                this.style.display = "none";
            };
        }

    } catch (error) {
        showError("Error displaying weather data. Please try refreshing.");
        console.error("UI Update Error:", error);
    }
}

function updateForecastUI(data) {
    try {
        if (!forecastContainer) return;

        forecastContainer.innerHTML = "";

        if (!data || !data.list || data.list.length === 0) {
            forecastContainer.innerHTML = '<p class="forecast-error">Forecast data unavailable</p>';
            hideLoader();
            return;
        }

        // Get forecast for next 3 days at noon (12:00:00)
        const dailyForecasts = data.list
            .filter(item => item.dt_txt.includes("12:00:00"))
            .slice(0, 3);

        // If no noon forecasts, get next 3 available forecasts
        if (dailyForecasts.length === 0) {
            const currentDate = new Date().getDate();
            const availableForecasts = data.list.filter(item => {
                const forecastDate = new Date(item.dt * 1000).getDate();
                return forecastDate !== currentDate;
            }).slice(0, 3);
            dailyForecasts.push(...availableForecasts);
        }

        if (dailyForecasts.length === 0) {
            forecastContainer.innerHTML = '<p class="forecast-error">No forecast data available</p>';
            hideLoader();
            return;
        }

        const tempUnit = currentUnit === "metric" ? "°C" : "°F";

        dailyForecasts.forEach(day => {
            const date = new Date(day.dt * 1000);
            const formattedDate = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
            const temp = Math.round(day.main.temp);
            const description = day.weather[0]?.description || "Unknown";
            const iconCode = day.weather[0]?.icon || "50d";

            const forecastDay = document.createElement("div");
            forecastDay.className = "forecast-day";
            forecastDay.innerHTML = `
                <p class="forecast-date">${formattedDate}</p>
                <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="${description}" class="forecast-icon" onerror="this.style.display='none';">
                <p class="forecast-temp">${temp}${tempUnit}</p>
                <p class="forecast-desc">${description}</p>
            `;

            forecastContainer.appendChild(forecastDay);
        });

    } catch (error) {
        console.error("Forecast UI Error:", error);
        if (forecastContainer) {
            forecastContainer.innerHTML = '<p class="forecast-error">Error displaying forecast</p>';
        }
    } finally {
        hideLoader();
    }
}

// Feature Functions
function handleSearch() {
    const input = cityInput?.value?.trim();

    if (!input) {
        showError("Please enter a city name, PIN code, or coordinates (lat,lon).");
        return;
    }

    const parsedInput = parseSearchInput(input);

    if (!parsedInput) {
        showError("Invalid input format. Please try again.");
        return;
    }

    switch (parsedInput.type) {
        case 'coords':
            getWeatherByCoords(parsedInput.lat, parsedInput.lon);
            break;
        case 'zip':
        case 'city':
            getWeatherByQuery(parsedInput.query);
            break;
        default:
            showError("Unable to process your search. Please try again.");
    }
}

function getUserLocation() {
    showLoader();

    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        fallbackToDefaultCity();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Update coordinate inputs if they exist
            if (latInput) latInput.value = lat.toFixed(6);
            if (lonInput) lonInput.value = lon.toFixed(6);

            getWeatherByCoords(lat, lon);
        },
        (error) => {
            let errorMsg;
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = "Location access denied. Please enable location services or search manually.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = "Location information unavailable. Searching manually.";
                    break;
                case error.TIMEOUT:
                    errorMsg = "Location request timed out. Searching manually.";
                    break;
                default:
                    errorMsg = "Unable to get your location. Searching manually.";
            }

            showError(errorMsg);
            fallbackToDefaultCity();
        },
        {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

function fallbackToDefaultCity() {
    // Try last successful search first
    const lastCity = localStorage.getItem("lastCity");
    const lastLat = localStorage.getItem("lastLat");
    const lastLon = localStorage.getItem("lastLon");

    if (lastLat && lastLon) {
        getWeatherByCoords(parseFloat(lastLat), parseFloat(lastLon));
    } else if (lastCity) {
        getWeatherByQuery(`q=${encodeURIComponent(lastCity)}`);
    } else {
        // Default to Guwahati
        getWeatherByQuery("q=Guwahati");
    }
}

function refreshWeatherData() {
    if (!refreshBtn) return;

    showLoader();

    // Animate refresh button
    const refreshIcon = refreshBtn.querySelector('.refresh-icon');
    if (refreshIcon) {
        refreshIcon.style.transition = 'transform 0.5s ease-in-out';
        refreshIcon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshIcon.style.transform = 'rotate(0deg)';
        }, 500);
    }

    // Refresh based on current data source
    if (currentLat !== null && currentLon !== null) {
        getWeatherByCoords(currentLat, currentLon);
    } else if (currentQuery) {
        getWeatherByQuery(currentQuery);
    } else {
        getUserLocation();
    }
}

function toggleTemperatureUnit() {
    if (!unitToggle) return;

    // Update current unit
    currentUnit = unitToggle.checked ? "imperial" : "metric";

    // Save preference
    localStorage.setItem("preferredUnit", currentUnit);

    // Refresh data with new unit
    if (currentLat !== null && currentLon !== null) {
        getWeatherByCoords(currentLat, currentLon);
    } else if (currentQuery) {
        getWeatherByQuery(currentQuery);
    }
}

function showCurrentCoordinates() {
    if (!showCoordsBtn || !latInput || !lonInput) return;

    if (currentLat !== null && currentLon !== null) {
        latInput.value = currentLat.toFixed(6);
        lonInput.value = currentLon.toFixed(6);

        // Visual feedback
        [latInput, lonInput].forEach(input => {
            input.style.backgroundColor = "#d0f0c0";
            setTimeout(() => {
                input.style.backgroundColor = "";
            }, 800);
        });
    } else {
        showError("No coordinates available. Getting your location...");
        getUserLocation();
    }
}

function handleCoordinateSearch() {
    if (!latInput || !lonInput) return;

    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);

    if (validateCoordinates(lat, lon)) {
        getWeatherByCoords(lat, lon);
    }
}

// Network status handling
function setupNetworkHandling() {
    window.addEventListener("online", () => {
        // Refresh when back online
        if (currentLat !== null && currentLon !== null) {
            getWeatherByCoords(currentLat, currentLon);
        } else if (currentQuery) {
            getWeatherByQuery(currentQuery);
        }
    });

    window.addEventListener("offline", () => {
        showError("You're offline. Please check your internet connection.");
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Search functionality
    if (searchBtn) {
        searchBtn.addEventListener("click", handleSearch);
    }

    if (cityInput) {
        cityInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") handleSearch();
        });

        cityInput.addEventListener("input", () => {
            if (errorMessage) errorMessage.style.display = "none";
        });
    }

    // Location functionality
    if (locateBtn) {
        locateBtn.addEventListener("click", getUserLocation);
    }

    // Coordinate functionality
    if (coordsSearchBtn) {
        coordsSearchBtn.addEventListener("click", handleCoordinateSearch);
    }

    if (latInput && lonInput) {
        [latInput, lonInput].forEach(input => {
            input.addEventListener("keypress", (event) => {
                if (event.key === "Enter") handleCoordinateSearch();
            });

            input.addEventListener("input", () => {
                if (errorMessage) errorMessage.style.display = "none";
            });
        });
    }

    if (showCoordsBtn) {
        showCoordsBtn.addEventListener("click", showCurrentCoordinates);
    }

    // Enhanced features
    if (refreshBtn) {
        refreshBtn.addEventListener("click", refreshWeatherData);
    }

    if (unitToggle) {
        unitToggle.addEventListener("change", toggleTemperatureUnit);
    }
}

// Initialization
function initializeApp() {
    // Update current date
    if (dateElement) {
        dateElement.textContent = formatDate(new Date());
    }

    // Load saved preferences
    const preferredUnit = localStorage.getItem("preferredUnit");
    if (preferredUnit) {
        currentUnit = preferredUnit;
        if (unitToggle) {
            unitToggle.checked = preferredUnit === "imperial";
        }
    }

    // Setup event listeners
    setupEventListeners();

    // Setup network handling
    setupNetworkHandling();

    // Load weather data
    const lastLat = localStorage.getItem("lastLat");
    const lastLon = localStorage.getItem("lastLon");
    const lastCity = localStorage.getItem("lastCity");

    if (lastLat && lastLon) {
        getWeatherByCoords(parseFloat(lastLat), parseFloat(lastLon));
    } else if (lastCity) {
        getWeatherByQuery(`q=${encodeURIComponent(lastCity)}`);
    } else {
        getUserLocation();
    }
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}