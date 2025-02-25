import fs from "fs";
import http from "http";

import express from 'express';
var app = express();

var httpServer = http.createServer(app);
app.use(express.static("dist"));

httpServer.listen(80);
