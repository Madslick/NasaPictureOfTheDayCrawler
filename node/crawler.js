'use strict';

const 
	DAY = 1000 * 60 * 60 * 24,
	MAX_SIMULTANEOUS_JOBS = 8,
	NasaPicturesOfTheDay = require('./NasaPicturesOfTheDay'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	http = require('http'),
	url = require('url'),
	start = Date.parse('2015-03-14'),
	timestamps = [],
	dates = {},
	nasa = new NasaPicturesOfTheDay();

let now = Date.now();

do {
	timestamps.push(now);
	now -= DAY;
} while (start < now);

if ( ! fs.existsSync('./pics') ) {
	fs.mkdirSync('./pics');
}

async.eachLimit(timestamps, MAX_SIMULTANEOUS_JOBS, job, (error) => {
	if (error) {
		console.error('Got an error: \n' + error);
	}
});

function job (timestamp, callback) {
	nasa.getPictureOfDayMeta(timestamp, (error, results) => {

		let link = results.hdurl || results.url,
			date = results.date,
			req;

		if ( dates[date] ) {
			callback(error);
			return;
		}
		else {
			dates[date] = true;
		}

		if ( ! (url && date) ) {
			console.log(typeof results);
			callback('no url: ' + JSON.stringify(results));
			return;
		}

		link = url.parse(link);

		req = http.request({
			hostname: link.hostname,
			path: link.path,
		}, res => {
			let type = res.headers['content-type'],
				extension = type.split('/')[1],
				isImage = type.match(/image/),
				writer;

			if ( ! isImage ) {
				return;
			}

			fs.writeFile(path.join('./pics', date+'.explanation.txt'), results.explanation, 'utf-8');
			writer = fs.createWriteStream(path.join('./pics', date+'.'+extension));
			res.pipe(writer);
		})

		req.end()
	});
}
