from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)

API_KEY = "48f9c8eca4bd7dae15ad7ffb13847378"

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/get_weather', methods=['POST'])
def get_weather():
    data = request.get_json()
    city = data.get('city')
    
    if not city:
        return jsonify({'error': 'City name is required'}), 400
    
    try:
        current_url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
        current_response = requests.get(current_url)
        current_data = current_response.json()
        
        if current_response.status_code != 200:
            return jsonify({'error': current_data.get('message', 'Unable to get weather data')}), 400

        forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
        forecast_response = requests.get(forecast_url)
        forecast_data = forecast_response.json()
        
        if forecast_response.status_code != 200:
            return jsonify({'error': forecast_data.get('message', 'Unable to get forecast data')}), 400
        
        return jsonify({
            'current': current_data,
            'forecast': forecast_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_weather_by_coords', methods=['POST'])
def get_weather_by_coords():
    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')
    
    try:
        current_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        current_response = requests.get(current_url)
        current_data = current_response.json()
        
        if current_response.status_code != 200:
            return jsonify({'error': current_data.get('message', 'Unable to get weather data')}), 400

        forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        forecast_response = requests.get(forecast_url)
        forecast_data = forecast_response.json()
        
        if forecast_response.status_code != 200:
            return jsonify({'error': forecast_data.get('message', 'Unable to get forecast data')}), 400
        
        return jsonify({
            'current': current_data,
            'forecast': forecast_data,
            'city': current_data['name']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)