import fs from "fs";
import http from "http";
import https from "https";
var privateKey  = fs.readFileSync('/etc/ssl/certs/floof.key', 'utf8');
var certificate = fs.readFileSync('/etc/ssl/certs/terminalfloof_me.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};
import express from 'express';
var app = express();

// your express configuration here

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
app.use(express.static("dist"));

httpServer.listen(80);
httpsServer.listen(443);
