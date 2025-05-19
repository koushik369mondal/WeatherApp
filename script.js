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
const latInput = document.getElementById('lat-input');
const lonInput = document.getElementById('lon-input');
const coordsSearchBtn = document.getElementById('coords-search-btn');
const showCoordsBtn = document.getElementById('show-coords-btn');

// Variables to store the current coordinates
let currentLat = null;
let currentLon = null;

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

// Function to show error message
function showError(message) {
    hideLoader();
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    // Shake the error message for attention
    errorMessage.classList.add('shake');
    setTimeout(() => {
        errorMessage.classList.remove('shake');
    }, 500);

    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Function to get weather data by city name
async function getWeatherData(city) {
    if (!city || city.trim() === '') {
        showError("Please enter a city name");
        return;
    }

    showLoader();
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);

        if (response.status === 404) {
            throw new Error("City not found. Please check the spelling and try again.");
        } else if (response.status === 401) {
            throw new Error("API key error. Please check your API key.");
        } else if (!response.ok) {
            throw new Error(`Weather service error (${response.status}). Please try again later.`);
        }

        const data = await response.json();
        updateWeatherUI(data);
        getForecastData(city);

        // Clear the error message if it was displayed
        errorMessage.style.display = 'none';

        // Save the last successful search to localStorage
        localStorage.setItem('lastCity', city);
    } catch (error) {
        showError(error.message || "Failed to fetch weather data. Please try again.");
        console.error("Error fetching weather data:", error);
    }
}

// Function to get weather data by coordinates
async function getWeatherByCoords(lat, lon) {
    showLoader();
    try {
        // Store the current coordinates
        currentLat = lat;
        currentLon = lon;

        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);

        if (response.status === 400) {
            throw new Error("Invalid coordinates. Please check and try again.");
        } else if (response.status === 401) {
            throw new Error("API key error. Please check your API key.");
        } else if (!response.ok) {
            throw new Error(`Weather service error (${response.status}). Please try again later.`);
        }

        const data = await response.json();
        updateWeatherUI(data);
        getForecastByCoords(lat, lon);

        // Clear the error message if it was displayed
        errorMessage.style.display = 'none';

        // Save the coordinates to localStorage
        localStorage.setItem('lastLat', lat);
        localStorage.setItem('lastLon', lon);
    } catch (error) {
        showError(error.message || "Failed to fetch weather data. Please try again.");
        console.error("Error fetching weather data:", error);
    }
}

// Function to update UI with weather data
function updateWeatherUI(data) {
    try {
        // Format the city name, including coordinates when available
        let locationText = `${data.name}, ${data.sys.country}`;

        // If we're using coordinates and they're stored, show them in the UI
        if (currentLat !== null && currentLon !== null) {
            locationText += ` (${currentLat.toFixed(4)}, ${currentLon.toFixed(4)})`;
        }

        cityName.textContent = locationText;
        temperature.textContent = `${Math.round(data.main.temp)}°C`;
        weatherDescription.textContent = data.weather[0]?.description || "Unknown";
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${data.wind.speed} km/h`;

        // Set weather icon
        const iconCode = data.weather[0]?.icon || "50d"; // Default to mist icon if missing
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.onerror = function () {
            // Fallback if the icon fails to load
            this.src = "/api/placeholder/100/100";
            this.alt = "Weather icon unavailable";
        };

        // Hide error message if it was shown
        errorMessage.style.display = 'none';
    } catch (error) {
        showError("Error displaying weather data. Try refreshing the page.");
        console.error("Error updating UI:", error);
    }
}

// Function to get forecast data by city name
async function getForecastData(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);

        if (!response.ok) {
            throw new Error("Forecast data not available for this location");
        }

        const data = await response.json();
        updateForecastUI(data);
    } catch (error) {
        console.error("Error fetching forecast data:", error);
        // Don't show error to user, as the main weather is still shown
    } finally {
        hideLoader();
    }
}

// Function to get forecast data by coordinates
async function getForecastByCoords(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);

        if (!response.ok) {
            throw new Error("Forecast data not available for this location");
        }

        const data = await response.json();
        updateForecastUI(data);
    } catch (error) {
        console.error("Error fetching forecast data:", error);
        // Don't show error to user, as the main weather is still shown
    } finally {
        hideLoader();
    }
}

// Function to update forecast UI
function updateForecastUI(data) {
    try {
        // Clear previous forecast data
        forecastContainer.innerHTML = '';

        // Check if there's valid forecast data
        if (!data || !data.list || data.list.length === 0) {
            forecastContainer.innerHTML = '<p class="forecast-error">Forecast data unavailable</p>';
            hideLoader();
            return;
        }

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

        // If no forecast days were found, try another approach
        if (Object.keys(forecastDays).length === 0) {
            // Just take the next 3 entries that are not from today
            let count = 0;
            for (const item of data.list) {
                const date = new Date(item.dt * 1000);
                const day = date.getDate();

                if (day !== currentDate) {
                    forecastDays[count] = item;
                    count++;
                    if (count >= 3) break;
                }
            }
        }

        // Take only the first 3 days
        const forecastItems = Object.values(forecastDays).slice(0, 3);

        if (forecastItems.length === 0) {
            forecastContainer.innerHTML = '<p class="forecast-error">No future forecast data available</p>';
            hideLoader();
            return;
        }

        forecastItems.forEach(day => {
            const date = new Date(day.dt * 1000);
            const temp = Math.round(day.main.temp);
            const description = day.weather[0]?.description || "Unknown";
            const iconCode = day.weather[0]?.icon || "50d";

            const forecastDay = document.createElement('div');
            forecastDay.className = 'forecast-day';

            forecastDay.innerHTML = `
                <p class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Weather Icon" class="forecast-icon" onerror="this.src='/api/placeholder/60/60'; this.alt='Icon unavailable';">
                <p class="forecast-temp">${temp}°C</p>
                <p class="forecast-desc">${description}</p>
            `;

            forecastContainer.appendChild(forecastDay);
        });
    } catch (error) {
        console.error("Error updating forecast UI:", error);
        forecastContainer.innerHTML = '<p class="forecast-error">Error displaying forecast</p>';
    } finally {
        hideLoader();
    }
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

                // Update the input fields with the coordinates
                latInput.value = lat.toFixed(6);
                lonInput.value = lon.toFixed(6);

                getWeatherByCoords(lat, lon);
            },
            // Error callback
            (error) => {
                let errorMsg;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = "Location access denied. Please enable location services in your browser or search for a city manually.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = "Location information is unavailable. Please search for a city manually.";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "Location request timed out. Please search for a city manually.";
                        break;
                    default:
                        errorMsg = "An unknown error occurred while getting your location. Please search for a city manually.";
                        break;
                }

                showError(errorMsg);

                // Try to load last searched city from localStorage
                const lastCity = localStorage.getItem('lastCity');
                if (lastCity) {
                    getWeatherData(lastCity);
                } else {
                    // Fall back to default city
                    getWeatherData('Guwahati');
                }
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        showError("Geolocation is not supported by your browser. Please search for a city manually.");

        // Try to load last searched city from localStorage
        const lastCity = localStorage.getItem('lastCity');
        if (lastCity) {
            getWeatherData(lastCity);
        } else {
            // Fall back to default city
            getWeatherData('Guwahati');
        }
    }
}

// Function to display current coordinates
function showCurrentCoordinates() {
    if (currentLat !== null && currentLon !== null) {
        latInput.value = currentLat.toFixed(6);
        lonInput.value = currentLon.toFixed(6);

        // Flash the fields to indicate they've been updated
        [latInput, lonInput].forEach(input => {
            input.style.backgroundColor = "#d0f0c0";
            setTimeout(() => {
                input.style.backgroundColor = "";
            }, 800);
        });
    } else {
        // Try to load coordinates from localStorage
        const lastLat = localStorage.getItem('lastLat');
        const lastLon = localStorage.getItem('lastLon');

        if (lastLat && lastLon) {
            latInput.value = lastLat;
            lonInput.value = lastLon;

            // Flash the fields to indicate they've been updated
            [latInput, lonInput].forEach(input => {
                input.style.backgroundColor = "#d0f0c0";
                setTimeout(() => {
                    input.style.backgroundColor = "";
                }, 800);
            });
        } else {
            // If no coordinates are stored, try to get them
            showError("No coordinates available. Getting your current location...");
            getUserLocation();
        }
    }
}

// Function to validate coordinates
function validateCoordinates(lat, lon) {
    // Check if both values are numbers
    if (isNaN(lat) || isNaN(lon)) {
        showError("Coordinates must be valid numbers");
        return false;
    }

    // Check latitude range (-90 to 90)
    if (lat < -90 || lat > 90) {
        showError("Latitude must be between -90 and 90 degrees");
        return false;
    }

    // Check longitude range (-180 to 180)
    if (lon < -180 || lon > 180) {
        showError("Longitude must be between -180 and 180 degrees");
        return false;
    }

    return true;
}

// Function to handle network errors
function handleNetworkErrors() {
    window.addEventListener('online', () => {
        // When connection is restored
        const lastCity = localStorage.getItem('lastCity');
        if (lastCity) {
            getWeatherData(lastCity);
        } else {
            getUserLocation();
        }
    });

    window.addEventListener('offline', () => {
        showError("You're offline. Please check your internet connection.");
    });
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    } else {
        showError("Please enter a city name");
    }
});

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        } else {
            showError("Please enter a city name");
        }
    }
});

// Clear error when user starts typing
cityInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
});

locateBtn.addEventListener('click', getUserLocation);

// Event listener for coordinates search button
coordsSearchBtn.addEventListener('click', () => {
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);

    if (validateCoordinates(lat, lon)) {
        getWeatherByCoords(lat, lon);
    }
});

// Event listener for coordinate inputs
[latInput, lonInput].forEach(input => {
    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            coordsSearchBtn.click();
        }
    });

    // Clear error when user starts typing
    input.addEventListener('input', () => {
        errorMessage.style.display = 'none';
    });
});

// Event listener for show coordinates button
showCoordsBtn.addEventListener('click', showCurrentCoordinates);

// Setup network error handling
handleNetworkErrors();

// On load, try to get user's location or use last successful search
window.addEventListener('load', () => {
    // First check if we have a stored location
    const lastCity = localStorage.getItem('lastCity');
    const lastLat = localStorage.getItem('lastLat');
    const lastLon = localStorage.getItem('lastLon');

    if (lastLat && lastLon) {
        getWeatherByCoords(parseFloat(lastLat), parseFloat(lastLon));
    } else if (lastCity) {
        getWeatherData(lastCity);
    } else {
        // Ask for user's location by default
        getUserLocation();
    }
});