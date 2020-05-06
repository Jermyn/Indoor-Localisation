const express = require('express');
// const config = require('./config')
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// app.listen(config.webServer.port, config.webServer.ip, function() {
//     return console.log('web server listening on', `${config.webServer.ip}:${config.webServer.port}`);
// });

app.listen(9000, function() {
  return console.log('web server listening on', `${9000}`);
})