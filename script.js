const apiKeyParts = ['fd6ca0', 'acd65e', '72ea6b', 'b9ef17', '2cb131da'];
const apiKey = apiKeyParts.join('');

let citiesList = []; // Will store city names for suggestions

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.querySelector('.search-button');
    const cityInput = document.querySelector('input');
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'suggestions';
    cityInput.insertAdjacentElement('afterend', suggestionsDiv);

    fetchCityList();

    searchBtn.addEventListener('click', fetchWeatherData);
    cityInput.addEventListener('input', showSuggestions);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchWeatherData();
    });
    cityInput.addEventListener('blur', () => {
        setTimeout(() => suggestionsDiv.style.display = 'none', 200);
    });
    cityInput.addEventListener('change', (e) => {
        e.target.value = capitalizeCityName(e.target.value);
    });

    async function fetchCityList() {
        try {
            const response = await fetch('https://countriesnow.space/api/v0.1/countries');
            const data = await response.json();
            citiesList = data.data.flatMap(country =>
                country.cities.map(city => `${capitalizeCityName(city)}, ${country.iso2}`)
            );
        } catch (error) {
            console.error('Error fetching city list:', error);
        }
    }

    function showSuggestions() {
        const input = cityInput.value.toLowerCase();
        if (!input) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        const matches = citiesList.filter(city =>
            city.toLowerCase().includes(input)
        ).slice(0, 5);

        if (matches.length) {
            suggestionsDiv.innerHTML = matches.map(city =>
                `<div class="suggestion">${city}</div>`
            ).join('');

            suggestionsDiv.style.display = 'block';

            document.querySelectorAll('.suggestion').forEach(item => {
                item.addEventListener('click', () => {
                    cityInput.value = item.textContent;
                    suggestionsDiv.style.display = 'none';
                    fetchWeatherData();
                });
            });
        } else {
            suggestionsDiv.style.display = 'none';
        }
    }

    function capitalizeCityName(city) {
        return city.split(/\s+/).map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    async function fetchWeatherData() {
        const city = cityInput.value.trim();
        if (!city) return;

        try {
            const [currentWeather, forecast] = await Promise.all([
                getWeather(city),
                getForecast(city)
            ]);
            updateUI(currentWeather, forecast);
        } catch (error) {
            console.error('Error fetching weather:', error);
            alert('Failed to get weather data. Please try again.');
        }
    }

    async function getWeather(city) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`
        );
        if (!response.ok) throw new Error('City not found');
        return await response.json();
    }

    async function getForecast(city) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${apiKey}`
        );
        if (!response.ok) throw new Error('Forecast not available');
        const data = await response.json();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);

        const tomorrowForecast = data.list.find(item => {
            const forecastTime = new Date(item.dt * 1000);
            return forecastTime.getDate() === tomorrow.getDate();
        });

        return tomorrowForecast || data.list[0];
    }

function updateUI(currentData, forecastData) {
    // Update location
    document.querySelector('.current-location p').textContent =
        `${currentData.name}, ${currentData.sys.country}`;

    // Update temperature number
    document.querySelector('.temperature-number').textContent =
        `${Math.round(currentData.main.temp)}°F`;

    // Update latitude & longitude
    document.querySelector('.latitude-longitude').innerHTML = `
        <p>Latitude: ${currentData.coord.lat.toFixed(2)}°</p>
        <p>Longitude: ${currentData.coord.lon.toFixed(2)}°</p>
    `;

    // Update current weather icon and condition name
    const currentWeatherIconContainer = document.getElementById('current-weather-icon');
    currentWeatherIconContainer.innerHTML = `
        <img src="https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png" alt="Weather Icon">
        <p>${currentData.weather[0].main}</p>
    `;

    // Update forecast
    if (forecastData) {
        document.querySelector('.forecast').innerHTML = `
            <p>Tomorrow</p>
            <p>${forecastData.weather[0].main}</p>
            <div class="forecast-icon" id="tomorrow-icon"></div>
            <p>${Math.round(forecastData.main.temp)}°F</p>
        `;
        updateWeatherIcon(forecastData.weather[0].icon, 'tomorrow-icon');
    }
}

    function updateWeatherIcon(iconCode, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
            const img = document.createElement('img');
            img.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            img.alt = "Weather Icon";
            element.appendChild(img);
        }
    }
});
