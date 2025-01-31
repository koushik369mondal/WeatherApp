document.getElementById('search-btn').addEventListener('click', function() {
    const city = document.getElementById('city-input').value;

    if (city === "") {
        alert("Please enter a city name.");
        return;
    }

    console.log('City entered:', city);

    document.getElementById('city-name').textContent = "City: " + city;

});


