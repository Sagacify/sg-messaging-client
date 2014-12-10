var kue = require('kue');

module.exports = (function () {
	'use strict';

	function SGSMessagingClient () {}

	SGSMessagingClient.prototype.init = function (config) {
		config = config || {};

		this.port = 6379;
		if('port' in config) {
			this.port = config.port;
		}

		this.host = '127.0.0.1';
		if('host' in config) {
			this.host = config.host;
		}

		this.q = kue.createQueue({
			prefix: 'q',
			redis: {
				port: this.port,
				host: this.host,
				auth: config.password,
				options: config.options
			}
		});
	};

	SGSMessagingClient.prototype.subscribe = function (jobName, jobMethod, options) {
		options = options || {};

		var concurrency = 1;
		if(typeof options.concurrency === 'number' && options.concurrency > 1) {
			concurrency = options.concurrency;
		}

		this.q.process(jobName, concurrency, function (job, done) {
			var input = job.data;
			var args = [input];

			if(options.progress === true) {
				args.push(job.progress.bind(job));
			}

			args.push(done);

			jobMethod.apply(jobMethod, args);
		});
	};

	return new SGSMessagingClient();
})();
