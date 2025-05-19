// ===== Favorites System Implementation =====

// DOM Elements for Favorites
const favoritesContainer = document.getElementById("favorites-container");
const noFavoritesMessage = document.getElementById("no-favorites-message");
const addFavoriteBtn = document.getElementById("add-favorite-btn");
const manageFavoritesBtn = document.getElementById("manage-favorites-btn");
const favoritesModal = document.getElementById("favorites-modal");
const favoritesList = document.getElementById("favorites-list");
const noFavorites = document.getElementById("no-favorites");
const closeModalBtn = document.getElementById("close-modal-btn");
const clearAllFavoritesBtn = document.getElementById("clear-all-favorites");
const closeModalX = document.querySelector(".close-modal");

// Array to store favorite cities
let favorites = [];

// Load favorites from localStorage
function loadFavorites() {
    const storedFavorites = localStorage.getItem('favoriteWeatherCities');
    if (storedFavorites) {
        favorites = JSON.parse(storedFavorites);
        updateFavoritesUI();
    }
}

// Save favorites to localStorage
function saveFavorites() {
    localStorage.setItem('favoriteWeatherCities', JSON.stringify(favorites));
    updateFavoritesUI();
}

// Update favorites UI in the main interface
function updateFavoritesUI() {
    favoritesContainer.innerHTML = '';

    if (favorites.length === 0) {
        noFavoritesMessage.style.display = 'block';
    } else {
        noFavoritesMessage.style.display = 'none';

        favorites.forEach(city => {
            const favoriteButton = document.createElement('div');
            favoriteButton.className = 'favorite-city';
            favoriteButton.innerHTML = `<span>⭐</span> ${city}`;
            favoriteButton.addEventListener('click', () => {
                getWeatherData(city);
            });
            favoritesContainer.appendChild(favoriteButton);
        });
    }
}

// Update favorites list in the modal
function updateFavoritesListUI() {
    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
        favoritesList.style.display = 'none';
        noFavorites.style.display = 'block';
    } else {
        favoritesList.style.display = 'block';
        favoritesList.classList.add('has-items');
        noFavorites.style.display = 'none';

        favorites.forEach((city, index) => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item';
            favoriteItem.innerHTML = `
                <span class="favorite-name">${city}</span>
                <div class="favorite-actions">
                    <button class="favorite-action-btn delete-favorite" data-index="${index}">🗑️</button>
                </div>
            `;
            favoritesList.appendChild(favoriteItem);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                removeFavorite(index);
            });
        });
    }
}

// Add current city to favorites
function addToFavorites() {
    // Only add if we have weather data
    if (currentWeatherData && currentWeatherData.name) {
        const cityName = currentWeatherData.name;

        // Don't add duplicates
        if (!favorites.includes(cityName)) {
            favorites.push(cityName);
            saveFavorites();

            // Show success feedback
            const originalText = addFavoriteBtn.innerHTML;
            addFavoriteBtn.innerHTML = '<span class="btn-icon">✅</span> Added!';

            setTimeout(() => {
                addFavoriteBtn.innerHTML = originalText;
            }, 2000);
        } else {
            // Show already exists feedback
            const originalText = addFavoriteBtn.innerHTML;
            addFavoriteBtn.innerHTML = '<span class="btn-icon">⚠️</span> Already in Favorites';

            setTimeout(() => {
                addFavoriteBtn.innerHTML = originalText;
            }, 2000);
        }
    } else {
        showError("No city selected to add to favorites");
    }
}

// Remove city from favorites
function removeFavorite(index) {
    if (index >= 0 && index < favorites.length) {
        favorites.splice(index, 1);
        saveFavorites();
        updateFavoritesListUI();
    }
}

// Clear all favorites
function clearAllFavorites() {
    // Add a confirmation
    if (favorites.length > 0 && confirm('Are you sure you want to remove all favorites?')) {
        favorites = [];
        saveFavorites();
        updateFavoritesListUI();
        closeModal(); // Close the modal after clearing
    }
}

// Open the favorites modal
function openModal() {
    updateFavoritesListUI();
    favoritesModal.style.display = 'block';

    // Prevent scrolling of background
    document.body.style.overflow = 'hidden';
}

// Close the favorites modal
function closeModal() {
    favoritesModal.style.display = 'none';

    // Re-enable scrolling
    document.body.style.overflow = 'auto';
}

// Event listeners for favorites functionality
addFavoriteBtn.addEventListener('click', addToFavorites);
manageFavoritesBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
closeModalX.addEventListener('click', closeModal);
clearAllFavoritesBtn.addEventListener('click', clearAllFavorites);

// Close modal when clicking outside the content
window.addEventListener('click', (e) => {
    if (e.target === favoritesModal) {
        closeModal();
    }
});

// Load favorites when page loads
document.addEventListener('DOMContentLoaded', loadFavorites);

// If the DOM is already loaded, load favorites now
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadFavorites();
}