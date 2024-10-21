document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('searchResults');
    const movieDetailsModal = document.getElementById('movieDetailsModal');
    const movieDetails = document.getElementById('movieDetails');
    const closeModal = document.querySelector('.close');
    
    const mulleListButton = document.getElementById('viewMulleList');
    const carmenListButton = document.getElementById('viewCarmenList');
    const movieMatchButton = document.getElementById('viewMovieMatch');
    const backToSearchButton = document.getElementById('backToSearch');

    let mulleMovieList = JSON.parse(localStorage.getItem('mulleMovies')) || [];
    let carmenMovieList = JSON.parse(localStorage.getItem('carmenMovies')) || [];

    // Exclude adult content based on keywords
    const adultKeywords = ['porn', 'porno', 'xxx', 'adult', 'erotic', 'sex'];

    // Search functionality
    searchInput.addEventListener('input', function () {
        const query = this.value;

        if (query === '') {
            resultsContainer.innerHTML = '';
            return;
        }

        fetch(`https://api.themoviedb.org/3/search/movie?api_key=53df8edb9ff33d01fb138df5eda21ca1&query=${encodeURIComponent(query)}&include_adult=false`)
            .then(response => response.json())
            .then(data => {
                resultsContainer.innerHTML = '';
                const filteredMovies = data.results.filter(movie => {
                    const hasAdultKeyword = adultKeywords.some(keyword => movie.title.toLowerCase().includes(keyword));
                    return !movie.adult && !hasAdultKeyword;
                });

                filteredMovies
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 6)
                    .forEach(movie => {
                        const movieCard = createMovieCard(movie);
                        resultsContainer.appendChild(movieCard);
                    });
            })
            .catch(error => console.error('Error:', error));
    });

    // Create movie card
    function createMovieCard(movie) {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'placeholder.jpg';
        const ratingPercentage = Math.round(movie.vote_average * 10);

        movieCard.innerHTML = `
            <img src="${posterPath}" alt="${movie.title}">
            <div class="rating">${ratingPercentage}%</div>
            <div class="overlay-buttons">
                <button class="action-btn add-mulle-btn">Add to Mulle's List</button>
                <button class="action-btn add-carmen-btn">Add to Carmen's List</button>
                <button class="action-btn details-btn">Details</button>
            </div>
        `;

        const addMulleBtn = movieCard.querySelector('.add-mulle-btn');
        const addCarmenBtn = movieCard.querySelector('.add-carmen-btn');

        // Check if movie is already in Mulle's List
        if (mulleMovieList.some(m => m.id === movie.id)) {
            updateButtonToOnList(addMulleBtn, 'Mulle');
        }

        // Check if movie is already in Carmen's List
        if (carmenMovieList.some(c => c.id === movie.id)) {
            updateButtonToOnList(addCarmenBtn, 'Carmen');
        }

        // Add or remove from Mulle's List
        addMulleBtn.addEventListener('click', function () {
            toggleMovieInList(movie, mulleMovieList, 'mulleMovies', addMulleBtn, 'Mulle');
        });

        // Add or remove from Carmen's List
        addCarmenBtn.addEventListener('click', function () {
            toggleMovieInList(movie, carmenMovieList, 'carmenMovies', addCarmenBtn, 'Carmen');
        });

        movieCard.querySelector('.details-btn').addEventListener('click', function () {
            showMovieDetails(movie);
        });

        return movieCard;
    }

    // Toggle movie in the list (add or remove)
    function toggleMovieInList(movie, list, storageKey, button, listName) {
        const movieIndex = list.findIndex(m => m.id === movie.id);
        
        if (movieIndex === -1) {
            list.push(movie);
            localStorage.setItem(storageKey, JSON.stringify(list));
            updateButtonToOnList(button, listName);
        } else {
            list.splice(movieIndex, 1);
            localStorage.setItem(storageKey, JSON.stringify(list));
            resetButtonToAddList(button, listName);
        }
    }

    // Update button to "On List" state
    function updateButtonToOnList(button, listName) {
        button.innerHTML = `<span>&#10003;</span> On ${listName}'s List`;
        button.style.backgroundColor = '#B8860B';
        button.style.color = '#fff';
    }

    // Reset button to "Add to List" state
    function resetButtonToAddList(button, listName) {
        button.innerHTML = `Add to ${listName}'s List`;
        button.style.backgroundColor = '#ffcc00';
        button.style.color = '#000';
    }

    // Show movie details in modal, fetch extra details, trailer, and streaming providers
    function showMovieDetails(movie) {
        const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'placeholder.jpg';

        fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=53df8edb9ff33d01fb138df5eda21ca1`)
            .then(response => response.json())
            .then(movieDetailsData => {
                const runtime = movieDetailsData.runtime ? `${movieDetailsData.runtime} min` : 'Runtime not available';
                const genres = movieDetailsData.genres.map(genre => genre.name).join(', ');

                movieDetails.innerHTML = `
                    <img src="${posterPath}" alt="${movie.title}" class="poster-img" />
                    <h2>${movie.title}</h2>
                    <p><strong>Release Year:</strong> ${movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'}</p>
                    <p><strong>Rating:</strong> ${movie.vote_average}</p>
                    <p><strong>Length:</strong> ${runtime}</p>
                    <p><strong>Genres:</strong> ${genres}</p>
                    <p><strong>Overview:</strong> ${movie.overview || 'No overview available.'}</p>
                    <div class="button-group">
                        <button class="action-btn add-mulle-btn">Add to Mulle's List</button>
                        <button class="action-btn add-carmen-btn">Add to Carmen's List</button>
                        <button class="action-btn watch-trailer-btn">Watch Trailer</button>
                    </div>
                    <div id="whereToWatch">
                        <strong>Where to Watch:</strong>
                    </div>
                    <div id="whereToRent">
                        <strong>Where to Rent:</strong>
                    </div>
                    <div id="trailerContainer"></div>
                `;

                movieDetailsModal.style.display = 'flex';
                movieDetailsModal.style.justifyContent = 'center';
                movieDetailsModal.style.alignItems = 'center';

                const addMulleBtn = movieDetailsModal.querySelector('.add-mulle-btn');
                const addCarmenBtn = movieDetailsModal.querySelector('.add-carmen-btn');
                const watchTrailerBtn = movieDetailsModal.querySelector('.watch-trailer-btn');

                if (mulleMovieList.some(m => m.id === movie.id)) {
                    updateButtonToOnList(addMulleBtn, 'Mulle');
                }

                if (carmenMovieList.some(c => c.id === movie.id)) {
                    updateButtonToOnList(addCarmenBtn, 'Carmen');
                }

                addMulleBtn.addEventListener('click', function () {
                    toggleMovieInList(movie, mulleMovieList, 'mulleMovies', addMulleBtn, 'Mulle');
                });

                addCarmenBtn.addEventListener('click', function () {
                    toggleMovieInList(movie, carmenMovieList, 'carmenMovies', addCarmenBtn, 'Carmen');
                });

                watchTrailerBtn.addEventListener('click', function () {
                    fetchTrailer(movie.id);
                });

                fetch(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=53df8edb9ff33d01fb138df5eda21ca1`)
                    .then(response => response.json())
                    .then(data => {
                        const providers = data.results.DK;

                        if (providers && providers.flatrate) {
                            const providerList = providers.flatrate.map(provider => `<img src="https://image.tmdb.org/t/p/w45${provider.logo_path}" alt="${provider.provider_name}" title="${provider.provider_name}" />`).join('');
                            document.getElementById('whereToWatch').innerHTML += providerList;
                        } else {
                            document.getElementById('whereToWatch').innerHTML += '<p>Not available for streaming in Denmark.</p>';
                        }

                        if (providers && providers.rent) {
                            const rentProviderList = providers.rent.map(provider => `<img src="https://image.tmdb.org/t/p/w45${provider.logo_path}" alt="${provider.provider_name}" title="${provider.provider_name}" />`).join('');
                            document.getElementById('whereToRent').innerHTML += rentProviderList;
                        } else {
                            document.getElementById('whereToRent').innerHTML += '<p>Not available for rent in Denmark.</p>';
                        }
                    })
                    .catch(error => console.error('Error fetching watch providers:', error));
            })
            .catch(error => console.error('Error fetching movie details:', error));
    }

    // Fetch trailer using TMDb API
    function fetchTrailer(movieId) {
        const apiKey = '53df8edb9ff33d01fb138df5eda21ca1';
        fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                const trailers = data.results.filter(video => video.type === 'Trailer' && video.site === 'YouTube');
                if (trailers.length > 0) {
                    const trailerKey = trailers[0].key;
                    showTrailerModal(trailerKey);
                } else {
                    alert('Trailer not available.');
                }
            })
            .catch(error => {
                console.error('Error fetching the trailer:', error);
                alert('Unable to load trailer.');
            });
    }

    // Trailer modal functionality
    const trailerModal = document.createElement('div');
    trailerModal.classList.add('trailer-modal');

    const trailerContent = document.createElement('div');
    trailerContent.classList.add('trailer-modal-content');

    const trailerClose = document.createElement('span');
    trailerClose.classList.add('trailer-close');
    trailerClose.innerHTML = '&times;';

    trailerContent.appendChild(trailerClose);
    trailerModal.appendChild(trailerContent);
    document.body.appendChild(trailerModal);

    trailerClose.addEventListener('click', function () {
        trailerModal.style.display = 'none';
        trailerContent.innerHTML = '';
        trailerContent.appendChild(trailerClose);
    });

    function showTrailerModal(trailerKey) {
        trailerContent.innerHTML = `
            <iframe width="100%" height="450" src="https://www.youtube.com/embed/${trailerKey}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        trailerContent.appendChild(trailerClose);
        trailerModal.style.display = 'flex';
        trailerModal.style.zIndex = '1002';
    }

    // Close modal when 'X' is clicked
    closeModal.addEventListener('click', function () {
        movieDetailsModal.style.display = 'none';
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function (event) {
        if (event.target === movieDetailsModal) {
            movieDetailsModal.style.display = 'none';
        }
    });

    // Display movie list
    function displayMovieList(movieList) {
        resultsContainer.innerHTML = '';
        movieList.forEach(movie => {
            const movieCard = createMovieCard(movie);
            resultsContainer.appendChild(movieCard);
        });
    }

    // Show Mulle's List
    mulleListButton.addEventListener('click', function () {
        displayMovieList(mulleMovieList);
        toggleBackButton(true);
    });

    // Show Carmen's List
    carmenListButton.addEventListener('click', function () {
        displayMovieList(carmenMovieList);
        toggleBackButton(true);
    });

    // Show Movie Match
    movieMatchButton.addEventListener('click', function () {
        const commonMovies = mulleMovieList.filter(m => carmenMovieList.some(c => c.id === m.id));
        displayMovieList(commonMovies);
        toggleBackButton(true);
    });

    // Toggle the back to search button
    function toggleBackButton(show) {
        backToSearchButton.style.display = show ? 'block' : 'none';
    }

    // Back to search
    backToSearchButton.addEventListener('click', function () {
        resultsContainer.innerHTML = '';
        toggleBackButton(false);
    });
});
