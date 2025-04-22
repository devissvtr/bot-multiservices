from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__, template_folder='../templates')
CORS(app)

@app.route('/')
def visionmaker():
    return render_template('services/visionmaker.html')

@app.route('/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        
        response = requests.get(f'https://iaeimagetotextai.22mzaima.workers.dev?prompt={prompt}')
        
        if response.ok:
            return response.content, 200, {'Content-Type': 'image/png'}
        else:
            return jsonify({'error': 'Failed to generate image'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3003)
