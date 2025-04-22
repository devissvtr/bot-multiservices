from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__, template_folder='../templates')
CORS(app)

@app.route('/')
def pdf_talkbot():
    return render_template('services/pdf-talkbot.html')

@app.route('/upload', methods=['POST'])
def upload_pdf():
    try:
        pdf_file = request.files['pdf']
        files = {'pdf': (pdf_file.filename, pdf_file, 'application/pdf')}
        response = requests.post('https://iaepdfai.22mzaima.workers.dev/upload', files=files)
        
        if response.ok:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to process PDF'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        data = request.get_json()
        question = data.get('question')
        source_id = data.get('sourceId')
        
        response = requests.post('https://iaepdfai.22mzaima.workers.dev/ask', 
            json={'question': question, 'sourceId': source_id})
        
        if response.ok:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to get answer'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3004)
