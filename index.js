const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 🚨 VULNERABILITY 1: Hardcoded Secrets (Will be caught by Gitleaks)

const GITHUB_TOKEN = "ghp_zR4xT9yP2wQ5vM7nL3kK8jH1fG6dD4sA9bC2";
const AWS_ACCESS_KEY_ID = "AKIAU6GDY4G8L9V2R3XQ";
const AWS_SECRET_ACCESS_KEY = "qXz8+L9mR2vK4pW7yN1bB5cV8nZ3xM6gH9fJ2sD0";
const SLACK_BOT_TOKEN = "xoxb-123456789012-1234567890123-aB3dE5fG7hI9jK1lM3nO5pQ7";

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
        <h1>DevSecOps Vulnerable Target</h1>
        <p>This app is designed to trigger CI/CD security alarms.</p>
        
        <form action="/ping" method="POST">
            <input type="text" name="ip" placeholder="8.8.8.8" />
            <button type="submit">Ping IP</button>
        </form>

        <form action="/greet" method="GET">
            <input type="text" name="name" placeholder="Enter your name" />
            <button type="submit">Greet</button>
        </form>
    `);
});

// 🚨 VULNERABILITY 2: Command Injection (Will be caught by Semgrep SAST)
app.post('/ping', (req, res) => {
    const ip = req.body.ip;
    // An attacker could pass "8.8.8.8; cat /etc/passwd" to compromise the server
    require('child_process').exec('ping -c 1 ' + ip, (error, stdout, stderr) => {
        res.send(`<pre>${stdout}</pre>`);
    });
});

// 🚨 VULNERABILITY 3: Reflected XSS & Missing Headers (Will be caught by OWASP ZAP DAST)
app.get('/greet', (req, res) => {
    const name = req.query.name || 'Guest';
    // No input sanitization and missing security headers like Content-Security-Policy
    res.send(`<h1>Hello, ${name}</h1>`); 
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
