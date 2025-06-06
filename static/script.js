document.addEventListener('DOMContentLoaded', function() {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const locationBtn = document.getElementById('location-btn');
    const currentWeather = document.getElementById('current-weather');
    const forecastContainer = document.getElementById('forecast-container');
    const errorMessage = document.getElementById('error-message');
    const lastUpdated = document.getElementById('last-updated');
    let currentUnit = 'c';

    searchBtn.addEventListener('click', fetchWeather);
    locationBtn.addEventListener('click', getLocationWeather);
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') fetchWeather();
    });
    
    document.querySelectorAll('.unit').forEach(unit => {
        unit.addEventListener('click', function() {
            if (!this.classList.contains('active')) {
                document.querySelectorAll('.unit').forEach(u => u.classList.remove('active'));
                this.classList.add('active');
                currentUnit = this.dataset.unit;
                updateTemperatureUnits();
            }
        });
    });
    
    async function fetchWeather() {
        const city = cityInput.value.trim();
        if (!city) {
            showError('Please enter a city name');
            return;
        }
        
        try {
            const response = await fetch('/get_weather', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ city: city })
            });
            
            const data = await response.json();
            
            if (response.status !== 200) {
                throw new Error(data.error || 'Failed to fetch weather data');
            }
            
            displayWeather(data.current, data.forecast);
            hideError();

            localStorage.setItem('lastCity', city);
        } catch (error) {
            showError(error.message);
        }
    }
    
    function getLocationWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch('/get_weather_by_coords', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                                lat: latitude, 
                                lon: longitude 
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (response.status !== 200) {
                            throw new Error(data.error || 'Failed to fetch weather data');
                        }
                        
                        displayWeather(data.current, data.forecast);
                        hideError();
                        cityInput.value = data.city;

                        localStorage.setItem('lastCity', data.city);
                    } catch (error) {
                        showError(error.message);
                    }
                },
                (error) => {
                    showError('Geolocation error: ' + error.message);
                }
            );
        } else {
            showError('Geolocation is not supported by your browser');
        }
    }
    
    function displayWeather(currentData, forecastData) {
        document.getElementById('city-name').textContent = `${currentData.name}, ${currentData.sys.country}`;
        document.getElementById('temperature').textContent = Math.round(currentData.main.temp);
        document.getElementById('weather-description').textContent = currentData.weather[0].description;
        document.getElementById('humidity').textContent = `${currentData.main.humidity}%`;
        document.getElementById('wind-speed').textContent = `${currentData.wind.speed} m/s`;
        document.getElementById('clouds').textContent = `${currentData.clouds.all}%`;
        
        const iconCode = currentData.weather[0].icon;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        document.getElementById('weather-icon').alt = currentData.weather[0].main;

        const forecastList = document.getElementById('forecast-list');
        forecastList.innerHTML = '';

        const dailyForecast = {};
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    temp: [],
                    icon: item.weather[0].icon,
                    description: item.weather[0].main
                };
            }
            
            dailyForecast[day].temp.push(item.main.temp);
        });

        Object.keys(dailyForecast).slice(0, 5).forEach(day => {
            const temps = dailyForecast[day].temp;
            const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
            const minTemp = Math.round(Math.min(...temps));
            const maxTemp = Math.round(Math.max(...temps));
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <h4>${day}</h4>
                <img src="https://openweathermap.org/img/wn/${dailyForecast[day].icon}.png" alt="${dailyForecast[day].description}">
                <p>${avgTemp}°</p>
                <small>${minTemp}° / ${maxTemp}°</small>
            `;
            forecastList.appendChild(forecastItem);
        });

        const now = new Date();
        lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

        currentWeather.classList.remove('hidden');
        forecastContainer.classList.remove('hidden');

        updateTemperatureUnits();
    }
    
    function updateTemperatureUnits() {
        const tempElement = document.getElementById('temperature');
        const currentTemp = parseFloat(tempElement.textContent);
        
        if (currentUnit === 'f') {
            
            const fahrenheit = (currentTemp * 9/5) + 32;
            tempElement.textContent = Math.round(fahrenheit);
        } else {
            
            tempElement.textContent = Math.round(currentTemp);
        }
        
        const forecastItems = document.querySelectorAll('.forecast-item p, .forecast-item small');
        forecastItems.forEach(item => {
            const text = item.textContent;
            const numbers = text.match(/-?\d+/g);
            
            if (numbers) {
                const newText = text.replace(/-?\d+/g, num => {
                    const number = parseInt(num);
                    if (currentUnit === 'f') {
                        return Math.round((number * 9/5) + 32);
                    } else {
                        return number; 
                    }
                });
                item.textContent = newText;
            }
        });
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        currentWeather.classList.add('hidden');
        forecastContainer.classList.add('hidden');
    }
    
    function hideError() {
        errorMessage.classList.add('hidden');
    }
    
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        cityInput.value = lastCity;
        fetchWeather();
    }
    setInterval(() => {
        if (cityInput.value.trim()) {
            fetchWeather();
        }
    }, 15 * 60 * 1000);
});