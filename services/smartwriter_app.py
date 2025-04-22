from flask import Flask, render_template

app = Flask(__name__, template_folder='../templates')

@app.route('/')
def smartwriter():
    return render_template('services/smartwriter.html')

if __name__ == '__main__':
    app.run(debug=True, port=3002)
