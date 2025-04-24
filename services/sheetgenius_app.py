from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import os
import pandas as pd
import io
import json
from werkzeug.utils import secure_filename

app = Flask(__name__, template_folder='../templates', static_folder='../static')
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
WORKER_URL = 'https://iaeexcelai.22mzaima.workers.dev/analyze'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def sheetgenius():
    return render_template('services/sheetgenius.html')

@app.route('/analyze', methods=['POST'])
def analyze_sheet():
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        
        # Check if file was selected
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'Allowed file types are CSV, XLSX, XLS'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0)
        
        if file_length > MAX_FILE_SIZE:
            return jsonify({'error': 'File size exceeds 5MB limit'}), 400
        
        # Since there might be issues with the worker URL, we'll analyze the file locally if worker fails
        try:
            # First, try using the worker
            files = {'file': (file.filename, file, 'application/vnd.ms-excel')}
            
            # Send to analysis service with timeout
            response = requests.post(
                WORKER_URL,
                files=files,
                timeout=10  # 10 seconds timeout
            )
            
            # Check if response is valid JSON
            try:
                response_data = response.json()
                if response.ok:
                    return jsonify(response_data)
            except ValueError:
                # If worker fails, continue with local analysis
                pass
                
        except Exception as e:
            # Continue with local analysis if worker fails
            print(f"Worker failed: {str(e)}")
        
        # If we get here, the worker either failed or returned an error,
        # so we'll analyze the file locally
        return local_analysis(file)
            
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

def local_analysis(file):
    """Analyze the file locally when the worker URL is not available"""
    try:
        # Reset file position
        file.seek(0)
        
        # Determine file type and read accordingly
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:  # Excel files
            df = pd.read_excel(file)
        
        # Basic data analysis
        insights = []
        summary = {}
        
        # Get basic stats
        row_count = len(df)
        col_count = len(df.columns)
        
        insights.append(f"Dataset contains {row_count} rows and {col_count} columns.")
        
        # Check for missing values
        missing_values = df.isnull().sum().sum()
        if missing_values > 0:
            insights.append(f"Found {missing_values} missing values in the dataset.")
        else:
            insights.append("No missing values found in the dataset.")
        
        # Identify numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        
        # Basic statistics for numeric columns
        if numeric_cols:
            insights.append(f"Found {len(numeric_cols)} numeric columns: {', '.join(numeric_cols)}")
            
            for col in numeric_cols[:3]:  # Limit to first 3 columns to avoid overload
                mean_val = df[col].mean()
                max_val = df[col].max()
                min_val = df[col].min()
                
                insights.append(f"Column '{col}' stats: Min={min_val:.2f}, Max={max_val:.2f}, Mean={mean_val:.2f}")
                
                # Detect outliers using IQR
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                outliers = df[(df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))].shape[0]
                
                if outliers > 0:
                    insights.append(f"Detected {outliers} potential outliers in column '{col}'.")
        
        # Categorical columns analysis
        cat_cols = df.select_dtypes(include=['object']).columns.tolist()
        if cat_cols:
            insights.append(f"Found {len(cat_cols)} categorical columns: {', '.join(cat_cols)}")
            
            for col in cat_cols[:2]:  # Limit to first 2 columns
                unique_vals = df[col].nunique()
                insights.append(f"Column '{col}' has {unique_vals} unique values.")
                
                if unique_vals <= 5:  # Only show distribution for columns with few categories
                    dist = df[col].value_counts().to_dict()
                    dist_str = ", ".join([f"{k}: {v}" for k, v in list(dist.items())[:3]])
                    insights.append(f"Top values in '{col}': {dist_str}")
        
        # Summary information
        summary = {
            "row_count": row_count,
            "column_count": col_count,
            "missing_values": int(missing_values),
            "numeric_columns": len(numeric_cols),
            "categorical_columns": len(cat_cols)
        }
        
        # Prepare data for return (limit to 100 rows for performance)
        data_dict = df.head(100).to_dict(orient='records')
        
        return jsonify({
            "data": data_dict,
            "insights": insights,
            "summary": summary
        })
    
    except Exception as e:
        return jsonify({'error': f'Error analyzing file: {str(e)}'}), 500

if __name__ == '__main__':
    # Create upload folder if it doesn't exist
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    app.run(debug=True, port=3005)