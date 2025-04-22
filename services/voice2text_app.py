from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__, template_folder='../templates')
CORS(app)

@app.route('/')
def voice2text():
    return render_template('services/voice2text.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    try:
        audio_file = request.files['audio']
        # Kirim file ke API
        files = {'audio': (audio_file.filename, audio_file, audio_file.content_type)}
        response = requests.post('https://iaetranscribeai.22mzaima.workers.dev', files=files)
        
        if response.ok:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to process audio'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001)
