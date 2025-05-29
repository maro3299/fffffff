// Shared data and utilities
const STORAGE_KEYS = {
    AUTH_TOKEN: 'filmhaven_auth_token',
    USER_DATA: 'filmhaven_user_data',
    WATCHLIST: 'filmhaven_watchlist'
};

// Utility functions
const storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)),
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    remove: (key) => localStorage.removeItem(key)
};

// Auth utilities
const auth = {
    isAuthenticated: () => !!storage.get(STORAGE_KEYS.AUTH_TOKEN),

    getCurrentUser: () => storage.get(STORAGE_KEYS.USER_DATA),

    login: async (email, password) => {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email === 'demo@example.com' && password === 'password') {
                    const userData = {
                        id: '1',
                        email,
                        fullName: 'Demo User'
                    };
                    storage.set(STORAGE_KEYS.AUTH_TOKEN, 'demo_token');
                    storage.set(STORAGE_KEYS.USER_DATA, userData);
                    resolve(userData);
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1000);
        });
    },

    register: async (email, password, fullName) => {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const userData = {
                    id: Math.random().toString(36).substr(2, 9),
                    email,
                    fullName
                };
                storage.set(STORAGE_KEYS.AUTH_TOKEN, 'demo_token');
                storage.set(STORAGE_KEYS.USER_DATA, userData);
                resolve(userData);
            }, 1000);
        });
    },

    logout: () => {
        storage.remove(STORAGE_KEYS.AUTH_TOKEN);
        storage.remove(STORAGE_KEYS.USER_DATA);
        window.location.href = '/';
    }
};

// Update auth button based on authentication status
function updateAuthButton() {
    const authButton = document.querySelector('.auth-button');
    if (authButton) {
        const isAuthenticated = auth.isAuthenticated();
        authButton.href = isAuthenticated ? '/pages/account.html' : '/pages/auth.html';
        const iconElement = authButton.querySelector('i');
        if (iconElement) {
            iconElement.setAttribute('data-lucide', isAuthenticated ? 'user-circle' : 'log-in');
            lucide.createIcons();
        }
    }
}

// Initialize shared elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Update auth button
    updateAuthButton();

    // Setup mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }

    // Setup search functionality
    const searchToggle = document.querySelector('.search-toggle');
    if (searchToggle) {
        let searchOpen = false;
        searchToggle.addEventListener('click', () => {
            if (!searchOpen) {
                const searchForm = document.createElement('form');
                searchForm.className = 'search-form';
                searchForm.innerHTML = `
                    <input type="search" placeholder="Wyszukaj film..." class="search-input">
                    <button type="button" class="search-close">
                        <i data-lucide="x"></i>
                    </button>
                `;

                document.querySelector('.navbar').appendChild(searchForm);
                lucide.createIcons();
                searchOpen = true;

                const searchInput = searchForm.querySelector('input');
                searchInput.focus();

                // Add search functionality
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        performSearch(e.target.value.trim());
                    }, 300); // Debounce search by 300ms
                });

                // Handle search form submission
                searchForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const searchTerm = searchInput.value.trim();
                    if (searchTerm) {
                        performSearch(searchTerm);
                        // Redirect to movies page with search results
                        window.location.href = `Filmy.html?search=${encodeURIComponent(searchTerm)}`;
                    }
                });

                const closeButton = searchForm.querySelector('.search-close');
                closeButton.addEventListener('click', () => {
                    searchForm.remove();
                    searchOpen = false;
                    // Clear any search results
                    clearSearchResults();
                });

                // Close search on Escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && searchOpen) {
                        searchForm.remove();
                        searchOpen = false;
                        clearSearchResults();
                    }
                });
            }
        });
    }
});


// Utility functions for session management
const SESSION_COOKIE_NAME = 'wfo_session';
const WATCHLIST_COOKIE_NAME = 'wfo_watchlist';

const session = {
    get: () => {
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${SESSION_COOKIE_NAME}=`));

        if (cookie) {
            return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        }
        return null;
    },

    set: (data) => {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; expires=${expiryDate.toUTCString()}; path=/`;
    },

    remove: () => {
        document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    },

    isAuthenticated: () => {
        return !!session.get();
    }
};

const watchlist = {
    get: () => {
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${WATCHLIST_COOKIE_NAME}=`));

        if (cookie) {
            return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        }
        return [];
    },

    set: (movieIds) => {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365); // Store for 1 year
        document.cookie = `${WATCHLIST_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(movieIds))}; expires=${expiryDate.toUTCString()}; path=/`;
    },

    add: (movieId) => {
        const currentList = watchlist.get();
        if (!currentList.includes(movieId)) {
            currentList.push(movieId);
            watchlist.set(currentList);
        }
    },

    remove: (movieId) => {
        const currentList = watchlist.get();
        const newList = currentList.filter(id => id !== movieId);
        watchlist.set(newList);
    },

    isInWatchlist: (movieId) => {
        return watchlist.get().includes(movieId);
    }
};

// Update UI based on authentication status
const updateAuthUI = () => {
    const userInfo = document.querySelector('.user-info');
    const loginButton = document.querySelector('.login-button');
    const logoutBtn = document.getElementById('logoutBtn');
    const userLoginSpan = document.querySelector('.user-login');

    if (session.isAuthenticated()) {
        const userData = session.get();
        if (loginButton) {
            loginButton.style.display = 'none';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
        if (userLoginSpan) {
            userLoginSpan.textContent = userData.login;
        }
    } else {
        if (loginButton) {
            loginButton.style.display = 'block';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
        if (userLoginSpan) {
            userLoginSpan.textContent = '';
        }
    }
};

// Search functionality
function performSearch(searchTerm) {
    if (!searchTerm) {
        clearSearchResults();
        return;
    }

    console.log('Searching for:', searchTerm);

    // Show search results dropdown if we're not on movies page
    if (!window.location.pathname.includes('Filmy.html')) {
        showSearchDropdown(searchTerm);
    }
}

function showSearchDropdown(searchTerm) {
    // Remove existing search results
    clearSearchResults();

    // Get movies from app.js if available
    if (typeof movies !== 'undefined') {
        const searchResults = movies.filter(movie =>
            movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movie.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movie.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 5); // Limit to 5 results

        if (searchResults.length > 0) {
            const searchDropdown = document.createElement('div');
            searchDropdown.className = 'search-dropdown';
            searchDropdown.innerHTML = `
                <div class="search-results">
                    <div class="search-results-header">
                        <span>Wyniki wyszukiwania (${searchResults.length})</span>
                    </div>
                    ${searchResults.map((movie, index) => {
                        const originalIndex = movies.findIndex(m => m.title === movie.title);
                        return `
                            <div class="search-result-item" data-movie-id="${originalIndex}">
                                <img src="${movie.imageUrl}" alt="${movie.title}" class="search-result-poster">
                                <div class="search-result-info">
                                    <h4 class="search-result-title">${movie.title}</h4>
                                    <p class="search-result-meta">${movie.year} • ${movie.rating}</p>
                                    <p class="search-result-genre">${movie.genre}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    <div class="search-results-footer">
                        <a href="Filmy.html?search=${encodeURIComponent(searchTerm)}" class="view-all-results">
                            Zobacz wszystkie wyniki
                        </a>
                    </div>
                </div>
            `;

            document.querySelector('.navbar').appendChild(searchDropdown);

            // Add click handlers for search results
            searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const movieId = parseInt(item.dataset.movieId);

                    // Clear search results and form
                    clearSearchResults();
                    const searchForm = document.querySelector('.search-form');
                    if (searchForm) {
                        searchForm.remove();
                    }

                    // Trigger movie overlay if setupMovieOverlay function exists and we have movies
                    if (typeof setupMovieOverlay === 'function' && typeof movies !== 'undefined') {
                        // Remove existing overlay if present
                        const existingOverlay = document.querySelector('.movie-details-overlay');
                        if (existingOverlay) {
                            existingOverlay.remove();
                        }

                        // Create overlay directly
                        const movieData = movies[movieId];
                        const inWatchlist = typeof isInWatchlist === 'function' ? isInWatchlist(movieId) : false;

                        const overlay = document.createElement('div');
                        overlay.className = 'movie-details-overlay';

                        overlay.innerHTML = `
                            <div class="movie-details-content" data-movie-id="${movieId}">
                                <button class="movie-details-close">
                                    <i data-lucide="x"></i>
                                </button>
                                <div class="movie-details-header">
                                    <img src="${movieData.imageUrl}" alt="${movieData.title}" class="movie-details-poster">
                                    <div class="movie-details-info">
                                        <h1 class="movie-details-title">${movieData.title}</h1>
                                        <div class="movie-details-meta">
                                            <span class="movie-details-genre">${movieData.genre}</span>
                                            <span class="movie-details-rating">
                                                <i data-lucide="star" class="star-icon"></i>
                                                <span>${movieData.rating}</span>
                                            </span>
                                        </div>
                                        <p class="movie-details-description">${movieData.description}</p>
                                        <div class="movie-details-actions">
                                            <a href="player.html?id=${movieId}" class="btn btn-primary play-button">
                                                <i data-lucide="play"></i>
                                                <span>Odtwórz film</span>
                                            </a>
                                            <button class="btn ${inWatchlist ? 'btn-primary' : 'btn-secondary'} watchlist-button">
                                                <i data-lucide="${inWatchlist ? 'check' : 'plus'}"></i>
                                                <span>${inWatchlist ? 'Usuń z listy' : 'Dodaj do listy'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        document.body.appendChild(overlay);
                        lucide.createIcons();

                        // Show overlay with animation
                        requestAnimationFrame(() => {
                            overlay.classList.add('active');
                        });

                        // Setup close functionality
                        const closeButton = overlay.querySelector('.movie-details-close');
                        closeButton.addEventListener('click', () => {
                            overlay.classList.remove('active');
                            setTimeout(() => overlay.remove(), 300);
                        });

                        // Close on escape or click outside
                        const closeOverlay = () => {
                            overlay.classList.remove('active');
                            setTimeout(() => overlay.remove(), 300);
                        };

                        overlay.addEventListener('click', (e) => {
                            if (e.target === overlay) closeOverlay();
                        });

                        document.addEventListener('keydown', function escHandler(e) {
                            if (e.key === 'Escape') {
                                closeOverlay();
                                document.removeEventListener('keydown', escHandler);
                            }
                        });

                        // Setup watchlist button
                        const watchlistButton = overlay.querySelector('.watchlist-button');
                        if (watchlistButton && typeof addToWatchlist === 'function' && typeof removeFromWatchlist === 'function') {
                            watchlistButton.onclick = (e) => {
                                e.preventDefault();
                                if (isInWatchlist(movieId)) {
                                    removeFromWatchlist(movieId);
                                } else {
                                    addToWatchlist(movieId);
                                }
                            };
                        }
                    } else {
                        // Redirect to player page if overlay not available
                        window.location.href = `player.html?id=${movieId}`;
                    }
                });
            });
        } else {
            const searchDropdown = document.createElement('div');
            searchDropdown.className = 'search-dropdown';
            searchDropdown.innerHTML = `
                <div class="search-results">
                    <div class="search-no-results">
                        <p>Nie znaleziono filmów dla: "${searchTerm}"</p>
                    </div>
                </div>
            `;
            document.querySelector('.navbar').appendChild(searchDropdown);
        }
    }
}

function clearSearchResults() {
    const existingDropdown = document.querySelector('.search-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            session.remove();
            window.location.href = 'index.html';
        });
    }
});