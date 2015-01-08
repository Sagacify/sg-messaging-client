var bull = require('bull');

module.exports = (function () {
	'use strict';

	function SGSMessagingClient () {
		this.queues = null;
	}

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

		this.queues = {};
	};

	SGSMessagingClient.prototype.subscribe = function (jobName, jobMethod) {
		if (!(jobName in this.queues)) {
			this.queues[jobName] = bull(jobName, this.port, this.host);
		}

		this.queues[jobName].process(function (job, done) {
			jobMethod.call(jobMethod, job.data, done);
		});
	};

	return new SGSMessagingClient();
})();
