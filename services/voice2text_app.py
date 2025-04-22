from flask import Flask, render_template

app = Flask(__name__, template_folder='../templates')

@app.route('/')
def voice2text():
    return render_template('services/voice2text.html')

if __name__ == '__main__':
    app.run(debug=True, port=3001)
