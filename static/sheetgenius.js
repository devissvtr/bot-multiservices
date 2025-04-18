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

uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        handleFileUpload(file);
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#00f0ff';
    uploadArea.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    uploadArea.style.backgroundColor = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    uploadArea.style.backgroundColor = 'transparent';
    
    if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.csv')) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload(file);
        } else {
            alert('Please upload a CSV file.');
        }
    }
});

analyzeBtn.addEventListener('click', analyzeData);
resetBtn.addEventListener('click', resetAnalysis);
chartTypeSelect.addEventListener('change', updateChart);

function handleFileUpload(file) {
    if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file.');
        return;
    }
    
    fileNameDisplay.textContent = `Selected file: ${file.name}`;
    fileNameDisplay.style.display = 'block';
    analysisControls.style.display = 'flex';
    
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
}

// Display data preview in table
function displayDataPreview(data) {
    if (!data || data.length === 0) return;
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create table header
    let tableHTML = '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    // Create table rows
    data.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            tableHTML += `<td>${row[header] || ''}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody>';
    dataPreview.innerHTML = tableHTML;
}

// Analyze the data
function analyzeData() {
    if (!parsedData || parsedData.data.length === 0) {
        alert('No data to analyze. Please upload a CSV file first.');
        return;
    }
    
    loadingSpinner.style.display = 'block';
    resultsSection.style.display = 'none';
    
    // Simulate analysis delay (in a real app, this would be server-side processing)
    setTimeout(() => {
        generateInsights();
        createChart();
        loadingSpinner.style.display = 'none';
        resultsSection.style.display = 'block';
    }, 1500);
}

// Generate insights about the data
function generateInsights() {
    if (!parsedData || parsedData.data.length === 0) return;
    
    const data = parsedData.data;
    const headers = Object.keys(data[0]);
    const numericHeaders = headers.filter(header => {
        return data.some(row => !isNaN(parseFloat(row[header])));
    });
    
    let insightsHTML = '';
    
    // Basic info
    insightsHTML += `<div class="insight-item">Dataset contains ${data.length} rows and ${headers.length} columns</div>`;
    
    // Numeric columns analysis
    if (numericHeaders.length > 0) {
        insightsHTML += `<div class="insight-item">Numeric columns detected: ${numericHeaders.join(', ')}</div>`;
        
        numericHeaders.forEach(header => {
            const values = data.map(row => parseFloat(row[header])).filter(val => !isNaN(val));
            if (values.length === 0) return;
            
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            insightsHTML += `
                <div class="insight-item">
                    <strong>${header}</strong>: Average = ${avg.toFixed(2)}, Min = ${min.toFixed(2)}, Max = ${max.toFixed(2)}
                </div>
            `;
        });
    }
    
    // Date detection
    const dateHeaders = headers.filter(header => {
        return data.some(row => {
            const val = row[header];
            return val && !isNaN(Date.parse(val));
        });
    });
    
    if (dateHeaders.length > 0) {
        insightsHTML += `<div class="insight-item">Date columns detected: ${dateHeaders.join(', ')}</div>`;
    }
    
    // Categorical detection
    const categoricalHeaders = headers.filter(header => {
        if (numericHeaders.includes(header) || dateHeaders.includes(header)) return false;
        const uniqueValues = new Set(data.map(row => row[header]));
        return uniqueValues.size > 1 && uniqueValues.size <= 10;
    });
    
    if (categoricalHeaders.length > 0) {
        insightsHTML += `<div class="insight-item">Potential categorical columns: ${categoricalHeaders.join(', ')}</div>`;
    }
    
    insightsContainer.innerHTML = insightsHTML;
}

// Create the initial chart
function createChart() {
    if (!parsedData || parsedData.data.length === 0) return;
    
    const data = parsedData.data;
    const headers = Object.keys(data[0]);
    const numericHeaders = headers.filter(header => {
        return data.some(row => !isNaN(parseFloat(row[header])));
    });
    
    if (numericHeaders.length < 2) {
        alert('Not enough numeric columns for visualization. Need at least 2 numeric columns.');
        return;
    }
    
    const ctx = document.getElementById('dataChart').getContext('2d');
    
    // Prepare chart data
    const labels = data.slice(0, 20).map((_, i) => `Row ${i + 1}`);
    const datasets = numericHeaders.slice(0, 3).map((header, i) => {
        const values = data.slice(0, 20).map(row => parseFloat(row[header]) || 0);
        const colors = ['#00f0ff', '#ff6b6b', '#5f27cd'];
        
        return {
            label: header,
            data: values,
            backgroundColor: colors[i],
            borderColor: colors[i],
            borderWidth: 1
        };
    });
    
    // Destroy previous chart if exists
    if (dataChart) {
        dataChart.destroy();
    }
    
    // Create new chart
    dataChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Update chart based on selected type
function updateChart() {
    if (!dataChart) return;
    
    const chartType = chartTypeSelect.value;
    dataChart.config.type = chartType;
    
    // Adjust options for different chart types
    if (chartType === 'pie' || chartType === 'doughnut') {
        // For pie/doughnut, we'll use just the first dataset
        if (dataChart.data.datasets.length > 1) {
            dataChart.data.datasets = [dataChart.data.datasets[0]];
        }
    }
    
    dataChart.update();
}

// Reset the analysis
function resetAnalysis() {
    fileInput.value = '';
    fileNameDisplay.style.display = 'none';
    analysisControls.style.display = 'none';
    resultsSection.style.display = 'none';
    insightsContainer.innerHTML = '';
    dataPreview.innerHTML = '';
    
    if (dataChart) {
        dataChart.destroy();
        dataChart = null;
    }
    
    parsedData = null;
}