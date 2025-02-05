document.getElementById('search-btn').addEventListener('click', function() {
    const city = document.getElementById('city-input').value.trim();

    if (city === "") {
        alert("Please enter a city name.");
        return;
    }

    fetchWeatherData(city);
});

async function fetchWeatherData(city) {
    const apiKey = '92386185a97a841e8c25345a7b728ec3';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            if (response.status === 401) {
                alert('Invalid API key. Please check your API key.');
            } else if (response.status === 404) {
                alert('City not found. Please enter a valid city name.');
            } else {
                alert(`Error: ${response.status}. Please try again later.`);
            }
            return;
        }

        const data = await response.json();
        console.log('Weather data:', data);

        // Update the DOM with weather information
        document.getElementById('city-name').textContent = `City: ${data.name}`;
        document.getElementById('temperature').textContent = `Temperature: ${data.main.temp}°C`;
        document.getElementById('weather-description').textContent = `Description: ${data.weather[0].description}`;
        document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
        document.getElementById('wind-speed').textContent = `Wind Speed: ${data.wind.speed} m/s`;

        // Display weather icon
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const weatherIcon = document.getElementById('weather-icon');
        weatherIcon.src = iconUrl;
        weatherIcon.style.display = "block";

    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Could not fetch weather data. Please try again later.');
    }
}
