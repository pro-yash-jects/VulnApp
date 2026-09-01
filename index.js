const express = require('express');
const app = express();
const PORT = process.env.PORT || 8002;

// 🚨 VULNERABILITY 1: Hardcoded Secrets (Will be caught by Gitleaks)
// These are fake AWS keys, but they match the regex pattern Gitleaks looks for.
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

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
