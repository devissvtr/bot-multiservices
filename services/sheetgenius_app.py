from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__, template_folder='../templates')
CORS(app)

@app.route('/')
def sheetgenius():
    return render_template('services/sheetgenius.html')

@app.route('/analyze', methods=['POST'])
def analyze_sheet():
    try:
        excel_file = request.files['excel']
        files = {'file': (excel_file.filename, excel_file, 'application/vnd.ms-excel')}
        response = requests.post('https://iaeexcelai.22mzaima.workers.dev/analyze', files=files)
        
        if response.ok:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to analyze Excel file'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3005)
