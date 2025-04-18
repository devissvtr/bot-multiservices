from flask import Flask, render_template, request, redirect, url_for, session

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # penting untuk session agar login bisa tersimpan

# LOGIN ROUTE (GET & POST)
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == 'admin' and password == '123':
            session['username'] = username
            return redirect(url_for('dashboard'))
        else:
            return "Login gagal, coba lagi."

    return render_template('login.html')

# LOGOUT
@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

# ==========================
# DASHBOARD / HOME
# ==========================
@app.route('/')
def dashboard():
    if 'username' in session:
        return render_template('dashboard.html', username=session['username'])
    else:
        return redirect(url_for('login'))

# OTHER ROUTES

@app.route('/voice2text')
def voice2text():
    return render_template('services/voice2text.html')

@app.route('/smartwriter')
def smartwriter():
    return render_template('services/smartwriter.html')

@app.route('/visionmaker')
def visionmaker():
    return render_template('services/visionmaker.html')

@app.route('/pdf-talkbot')
def pdf_talkbot():
    return render_template('services/pdf-talkbot.html')

@app.route('/sheetgenius')
def sheetgenius():
    return render_template('services/sheetgenius.html')

@app.route('/aboutUs')
def about_us():
    return render_template('aboutUs.html')

# RUN

if __name__ == '__main__':
    app.run(debug=True)