const chokidar = require('chokidar');

const mappedEventTypes = {
	add: 'add',
	change: 'change',
	unlink: 'delete'
};

const friendlyEventTypes = {
	add: 'added',
	change: 'changed',
	unlink: 'deleted'
};

function isValidEventType(eventType, validEventTypes) {
	if(mappedEventTypes.hasOwnProperty(eventType)) {
		const mappedEventType = mappedEventTypes[eventType];
		return validEventTypes.includes(mappedEventType);
	}

	return false;
}

function createWatcher(target, logger, skelApi) {
	let watcher;

	logger.info(`Initializing watcher "${target.name}" for paths "${target.paths}"...`);

	try {
		watcher = chokidar.watch(target.paths, {ignoreInitial: true});
	} catch(e) {
		return {
			success: false,
			error: e
		};
	}

	watcher.on('all', (eventType, filepath) => {
		if(isValidEventType(eventType, target.events)) {
			logger.info(`File "${filepath}" was ${friendlyEventTypes[eventType]}.`);
			runTasks(target.tasks, skelApi, filepath);
		}
	});

	return {
		success: true,
		watcher
	};
}

function closeWatchers(results) {
	results.forEach(result => {
		if(result.watcher) {
			result.watcher.close();
		}
	});
}

function runTasks(tasks, skelApi, filepath) {
	const source = {
		filepath
	};

	return Promise.all(
		tasks.map(task =>
			skelApi.runTask(task.name, {
				subTasksToInclude: task.subTasks,
				source
			})
		)
	);
}

function run(config, options, skelApi) {

	return new Promise((resolve, reject) => {

		if(config.targets && Array.isArray(config.targets) && config.targets.length) {
			const results = config.targets.map(target => createWatcher(target, options.logger, skelApi));

			const firstFailedResult = results.find(result => result.success === false);

			if(firstFailedResult) {
				closeWatchers(results);

				options.logger.error(firstFailedResult.error);
				reject({
					status: 'error',
					error: firstFailedResult.error
				});
			} else {
				resolve({
					status: 'running'
				});
			}
		} else {
			const message = 'No watch targets specified.';
			options.logger.error(message);
			reject({
				status: 'error',
				message: message
			});
		}
	});
}

module.exports = skeletorPluginWatch = () => (
	{
		run
	}
);