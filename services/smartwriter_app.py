from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__, template_folder='../templates')
CORS(app)  # Enable CORS

@app.route('/')
def smartwriter():
    return render_template('services/smartwriter.html')

@app.route('/generate', methods=['POST'])
def generate_text():
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        
        # Kirim request ke API
        api_url = 'https://iaesearchai.22mzaima.workers.dev'
        response = requests.get(f'{api_url}?prompt={prompt}')
        
        if response.ok:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to get response from API'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3002)
