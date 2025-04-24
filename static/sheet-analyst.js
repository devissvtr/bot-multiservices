$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

let parsedData = null;
let dataChart = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const analysisControls = document.getElementById('analysisControls');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsSection = document.getElementById('resultsSection');
const insightsContainer = document.getElementById('insightsContainer');
const dataPreview = document.getElementById('dataPreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const chartTypeSelect = document.getElementById('chartType');

// Event listeners
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileChange);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
analyzeBtn.addEventListener('click', analyzeData);
resetBtn.addEventListener('click', resetAnalysis);
chartTypeSelect.addEventListener('change', updateChart);

function handleFileChange(e) {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    handleFileUpload(file);
  }
}

function handleDragOver(e) {
  e.preventDefault();
  uploadArea.style.borderColor = '#00f0ff';
  uploadArea.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
}

function handleDragLeave() {
  uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
  uploadArea.style.backgroundColor = 'transparent';
}

function handleDrop(e) {
  e.preventDefault();
  uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
  uploadArea.style.backgroundColor = 'transparent';
  
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (isValidFile(file)) {
      fileInput.files = e.dataTransfer.files;
      handleFileUpload(file);
    } else {
      alert('Please upload a CSV, XLSX, or XLS file.');
    }
  }
}

function isValidFile(file) {
  const validExtensions = ['.csv', '.xlsx', '.xls'];
  return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

function handleFileUpload(file) {
  if (!isValidFile(file)) {
    alert('Please upload a CSV, XLSX, or XLS file.');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File size exceeds 5MB limit. Please upload a smaller file.');
    return;
  }
  
  fileNameDisplay.textContent = `Selected file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
  fileNameDisplay.style.display = 'block';
  analysisControls.style.display = 'flex';
  
  if (file.name.endsWith('.csv')) {
    Papa.parse(file, {
      header: true,
      complete: function(results) {
        parsedData = results;
        displayDataPreview(results.data.slice(0, 10));
      },
      error: function(error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the file format.');
      }
    });
  } else {
    // Just store the file for now, it will be processed on the server side
    displayGenericPreview(file);
  }
}

function displayGenericPreview(file) {
  // Show a message that the file will be processed on analysis
  dataPreview.innerHTML = `<tr><td colspan="3" class="text-center">The ${file.name.split('.').pop().toUpperCase()} file will be processed when you click "Analyze Data"</td></tr>`;
}

function analyzeData() {
  if (!fileInput.files || fileInput.files.length === 0) {
    alert('No file to analyze. Please upload a file first.');
    return;
  }
  
  loadingSpinner.style.display = 'block';
  resultsSection.style.display = 'none';
  
  // Prepare form data
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  
  // Send to backend
  fetch('/analyze', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw err; });
    }
    return response.json();
  })
  .then(data => {
    // Save the analysis data
    parsedData = {
      data: data.data || [],
      insights: data.insights || [],
      summary: data.summary || {}
    };
    
    // Display results
    displayInsights(parsedData.insights);
    displayDataPreview(parsedData.data.slice(0, 10));
    createChart(parsedData.data);
    
    loadingSpinner.style.display = 'none';
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  })
  .catch(error => {
    loadingSpinner.style.display = 'none';
    alert(`Error: ${error.error || 'Failed to analyze data'}`);
    console.error('Analysis error:', error);
  });
}

function displayInsights(insights) {
  insightsContainer.innerHTML = '';
  
  if (!insights || insights.length === 0) {
    insightsContainer.innerHTML = '<p>No insights available for this dataset.</p>';
    return;
  }
  
  insights.forEach(insight => {
    const insightItem = document.createElement('div');
    insightItem.className = 'insight-item';
    insightItem.textContent = insight;
    insightsContainer.appendChild(insightItem);
  });
}

function displayDataPreview(data) {
  dataPreview.innerHTML = '';
  
  if (!data || data.length === 0) {
    dataPreview.innerHTML = '<tr><td colspan="3" class="text-center">No data available</td></tr>';
    return;
  }
  
  // Create table header
  const headerRow = document.createElement('tr');
  const columns = Object.keys(data[0]);
  
  columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = column;
    headerRow.appendChild(th);
  });
  
  dataPreview.appendChild(headerRow);
  
  // Create table rows
  data.forEach(row => {
    const tr = document.createElement('tr');
    
    columns.forEach(column => {
      const td = document.createElement('td');
      td.textContent = row[column];
      tr.appendChild(td);
    });
    
    dataPreview.appendChild(tr);
  });
}

function createChart(data) {
  if (!data || data.length === 0) return;
  
  // Find numeric columns for charting
  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(column => {
    return !isNaN(parseFloat(data[0][column]));
  });
  
  // If no numeric columns, can't create a chart
  if (numericColumns.length === 0) {
    document.querySelector('.chart-container').innerHTML = 
      '<p class="text-center">No numeric data available for charting</p>';
    return;
  }
  
  // Use the first non-numeric column as labels if available
  const labelColumn = columns.find(column => isNaN(parseFloat(data[0][column]))) || columns[0];
  const dataColumn = numericColumns[0]; // Use the first numeric column for data
  
  const chartData = {
    labels: data.map(row => row[labelColumn]),
    datasets: [{
      label: dataColumn,
      data: data.map(row => parseFloat(row[dataColumn])),
      backgroundColor: 'rgba(0, 240, 255, 0.5)',
      borderColor: '#00f0ff',
      borderWidth: 1
    }]
  };
  
  const ctx = document.getElementById('dataChart').getContext('2d');
  
  // Destroy previous chart if exists
  if (dataChart) {
    dataChart.destroy();
  }
  
  // Create new chart
  dataChart = new Chart(ctx, {
    type: chartTypeSelect.value,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#fff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#fff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#fff'
          }
        }
      }
    }
  });
}

function updateChart() {
  if (dataChart && parsedData && parsedData.data) {
    dataChart.config.type = chartTypeSelect.value;
    dataChart.update();
  }
}

function resetAnalysis() {
  // Reset file input
  fileInput.value = '';
  fileNameDisplay.style.display = 'none';
  analysisControls.style.display = 'none';
  resultsSection.style.display = 'none';
  
  // Clear data
  parsedData = null;
  
  // Reset UI
  dataPreview.innerHTML = '';
  insightsContainer.innerHTML = '';
  
  // Destroy chart if exists
  if (dataChart) {
    dataChart.destroy();
    dataChart = null;
  }
  
  // Reset file upload area
  uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
  uploadArea.style.backgroundColor = 'transparent';
}