var kue = require('kue');
var zerorpc = require('zerorpc');

function sgMessagingClient (config) {
	var instance = this;

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

	if(config.xLanguage) {
		this.client = new zerorpc.Client({
			timeout: 1 * 60 * 5
		});
		this.client.connect('tcp://127.0.0.1:4242');

		this.connectToRemoteCommandProvider();
	}

	return (sgMessagingClient = function () {
		return instance;
	});
}

sgMessagingClient.prototype.subscribe = function (jobName, jobMethod, options) {
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

sgMessagingClient.prototype.connectToRemoteCommandProvider = function () {
	var me = this;

	this.client.invoke('COMMAND_LIST', {}, function (e, res, streaming) {
		if(e) {
			return console.log(e);
		}

		function commandWrapper (command) {
			return function (input, progressCallback, callback) {
				me.client.invoke(command, input, callback);
			};
		}

		var parameters;
		for(var command in res) {
			parameters = res[command];

			sgMessagingClient().subscribe(command, commandWrapper(command), parameters);
		}

	});
};

module.exports = sgMessagingClient;