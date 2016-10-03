'use strict';

const noop = function () {};

let https = require('https');


class NasaPicturesOfTheDay {

	constructor (config) {
		this.config = Object.assign({
			apiKey: 'DDxbM6VV2kuusHvAsCQfZKThSQ2f5Li1gcGdsHyp',
		}, config || {});
	}

	getPictureOfDayMeta (timestamp, callback) {
		callback = callback || noop;

		let request = https.request({
			hostname: 'api.nasa.gov', 
			method: 'GET',
			path: '/planetary/apod?' + [
				'date=' + new Date(timestamp).toISOString().substr(0, 10),
				'api_key=' + this.config.apiKey,
			].join('&')
		}, res => {
			let responseText = '';

			res.on('data', chunk => {
				responseText += chunk;
			});

			res.on('end', () => {
				let response;

				try {
					response = JSON.parse(responseText);
					callback(null, response);
				}
				catch (e) {
					console.log("GOT AN ERROR" + e);
					callback(e, responseText);
				}
			});

			res.on('error', function () {
				console.log('here error');
				callback();
			});
		});

		request.end();
	}

}

module.exports = NasaPicturesOfTheDay;
