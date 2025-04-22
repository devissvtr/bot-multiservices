@echo off
echo Starting all services...

:: Buka terminal baru untuk setiap service
start cmd /k "python app.py"
start cmd /k "python services/voice2text_app.py"
start cmd /k "python services/smartwriter_app.py"
start cmd /k "python services/visionmaker_app.py"
start cmd /k "python services/pdf-talkbot_app.py"
start cmd /k "python services/sheetgenius_app.py"

echo All services have been started!
