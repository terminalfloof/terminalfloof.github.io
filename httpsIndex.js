import fs from 'fs';
import http from 'http';
import https from 'https';
import 'dotenv/config';
// var privateKey = fs.readFileSync('/etc/ssl/certs/floof.key', 'utf8');
// var certificate = fs.readFileSync(
// 	'/etc/ssl/certs/terminalfloof_me.crt',
// 	'utf8'
// );

// var credentials = { key: privateKey, cert: certificate };
import express from 'express';
var app = express();

const redirect_uri = 'http://localhost/callback';

// app.get('/login', function (req, res) {
// 	var state = Math.random().toString(36).substring(7);
// 	var scope = 'user-read-recently-played';

// 	const params = new URLSearchParams({
// 		response_type: 'code',
// 		client_id: process.env.CLIENT_ID,
// 		scope: scope,
// 		redirect_uri: redirect_uri,
// 		state: state,
// 	});
// 	res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
// });

// app.get('/callback', async function (req, res) {
// 	var code = req.query.code || null;
// 	var state = req.query.state || null;

// 	if (state === null) {
// 		res.send('state mismatch');
// 	} else {
// 		const result = await fetch('https://accounts.spotify.com/api/token', {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/x-www-form-urlencoded',
// 				Authorization:
// 					'Basic ' +
// 					Buffer.from(
// 						process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET
// 					).toString('base64'),
// 			},
// 			body: new URLSearchParams({
// 				code: code,
// 				redirect_uri: redirect_uri,
// 				grant_type: 'authorization_code',
// 			}).toString(),
// 		});

// 		console.log(await result.json());
// 	}
// });

let token = '';

async function refreshToken() {
	console.log('refreshing token.');
	const result = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization:
				'Basic ' +
				Buffer.from(
					process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET
				).toString('base64'),
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: process.env.REFRESH_TOKEN,
		}).toString(),
	});
	const resultJson = await result.json();

	if (result.status === 200) {
		token = resultJson.access_token;
		console.log('token refreshed.');
	} else {
		console.log('token refresh failed.');
	}
}

await refreshToken();

let lastPlayed = {};
let lastSong = '';
async function updateLastPlayed() {
	console.log('updating last played');
	const result = await fetch(
		'https://api.spotify.com/v1/me/player/recently-played',
		{
			headers: {
				Authorization: 'Bearer ' + token,
			},
		}
	);

	if (result.ok) {
		const resultJson = await result.json();
		lastPlayed = resultJson;
		if (
			lastPlayed.items !== undefined &&
			lastPlayed.items[0].track.name !== lastSong
		) {
			lastSong = lastPlayed.items[0].track.name;
			console.log('found new song: ' + lastSong);
		}
	} else if (result.status === 401) {
		console.log('token expired.');
		await refreshToken();
		updateLastPlayed();
	} else {
		console.log('error fetching last played.');
		console.log(result);
	}
}

setInterval(updateLastPlayed, 1000 * 30);
await updateLastPlayed();

// app.get('/forceUpdate', async function (req, res) {
// 	await updateLastPlayed();
// 	res.send('done');
// });

app.get('/lastPlayed', async function (req, res) {
	if (lastPlayed.items === undefined) {
		await refreshToken();
		await updateLastPlayed();
	}
	if (lastPlayed.items === undefined) {
		res.send({});
		return;
	}
	res.send(lastPlayed.items[0]);
});

var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);
app.use(express.static('dist'));

httpServer.listen(80);
// httpsServer.listen(443);
