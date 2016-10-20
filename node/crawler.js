'use strict';

const
	NasaPicturesOfTheDay = require('./NasaPicturesOfTheDay'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	http = require('http'),
	url = require('url'),
	readline = require('readline'),
	apiKeys = [
		'DDxbM6VV2kuusHvAsCQfZKThSQ2f5Li1gcGdsHyp',
		// ADD MORE API KEYS HERE
	],
	interfaces = apiKeys.map(apiKey => {
		return new NasaPicturesOfTheDay({
			apiKey: apiKey,
		});
	}),
	DAY = 1000 * 60 * 60 * 24,
	timestamps = [],
	dates = {},
	MAX_SIMULTANEOUS_JOBS = interfaces.length,
	start = Date.parse('2014-03-14'),
	rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let
	savePath = './pics',
	now = Date.now(),
	mod = 0; // rotate the API keys


// Prompt for save file path, and then run main
rl.question(`Please enter a save path (default ${savePath})\n>`, answer => {
	if ( answer ) {
		savePath = answer;
	}
	rl.close();
	main();
});


function main () {
	// setup timestamps (TODO use generator instead)
	do {
		timestamps.push(now);
		now -= DAY;
	} while (start < now);

	// Make this folder (TODO prompt user or get path from config)
	if ( ! fs.existsSync(savePath) ) {
		fs.mkdirSync(savePath);
	}

	// Do the jobs
	async.eachLimit(timestamps, MAX_SIMULTANEOUS_JOBS, job, (error) => {
		if (error) {
			console.error('Got an error: \n' + error);
		}
	});
}


// Call the POTD API and save the meta as JSON and any image
function job (timestamp, callback) {
	let nasa = interfaces[ ++mod % interfaces.length ];

	nasa.getPictureOfDayMeta(timestamp, (error, results) => {
		let link = results.hdurl || results.url,
			date = results.date,
			req;

		// Theoretically you shouldn't overlap a date, but this ensures
		if ( dates[date] ) {
			callback();
			return;
		}
		else {
			dates[date] = true;
		}

		if ( results.media_type !== 'image' ) {
			console.info(`Skipping: ${date}`);
			callback();
			return;
		}

		link = url.parse(link);

		// Call the image link and save it allong with the JSON
		req = http.request({
			hostname: link.hostname,
			path: link.path,
		}, res => {
			let type = res.headers['content-type'],
				extension = type.split('/')[1],
				isImage = /image/i.test(type),
				saveImagePath = path.join(savePath, `${date}.${extension}`),
				saveMetaPath = path.join(savePath, `${date}.meta.json`),
				writer;

			// Extra caution
			if ( ! isImage ) {
				return callback();
			}

			console.info(`Saving: ${saveImagePath} \n\t${saveMetaPath}`);

			// Save the all the meta info
			fs.writeFile(saveMetaPath, JSON.stringify(results, null, '\t'), 'utf-8');

			// Save the image
			writer = fs.createWriteStream(saveImagePath);
			res.pipe(writer);
			res.on('end', () => {
				writer.end();
				callback();
			});
		});

		req.end()
	});
}
