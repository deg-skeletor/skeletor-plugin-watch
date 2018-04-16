'use strict';

const chokidar = jest.genMockFromModule('chokidar');

let returnValues = [];
let eventHandlers = [];

function __reset() {
	returnValues = [];
	eventHandlers = [];
}

function __setWatchReturnValues(newReturnValues) {
	returnValues = newReturnValues;
}

function __createWatcher() {
	return {
		on, close
	};
}

function __fireEvent(eventType, filepath) {
	eventHandlers.forEach(eventHandler => eventHandler(eventType, filepath));
}

function on(eventType, eventHandler) {
	eventHandlers.push(eventHandler);
}

function close() {

}

function watch(paths, options) {
	const returnValue = returnValues.find(returnValue => returnValue.paths === paths);

	if(returnValue) {
		if(returnValue.watcher) {
			return returnValue.watcher;
		} else {
			throw returnValue.error;
		}
	}

	throw new Error(`Could not find watcher for "${paths}"`);
}

chokidar.__setWatchReturnValues = __setWatchReturnValues;
chokidar.__createWatcher = __createWatcher;
chokidar.__reset = __reset;
chokidar.__fireEvent = __fireEvent;
chokidar.watch = watch;

module.exports = chokidar;