const samplePlugin = require('./index');

const logger = {
	info: () => {},
	warn: () => {},
	error: () => {}
};

const pluginOptions = {
	logger
};

const configs = {
	singleTarget: {
		targets: [
			{
				name: "target1",
				paths: "source/*.*",
				events: ['add', 'change', 'delete'],
				tasks: [
					{
						name: "build"
					}
				]
			}
		]
	},
	multipleTargets: {
		targets: [
			{
				name: "target1",
				paths: "source/target1/*.*",
				events: ['add', 'change', 'delete'],
				tasks: [
					{
						name: "build"
					}
				]
			},
			{
				name: "target2",
				paths: "source/target2/*.*",
				events: ['add', 'change', 'delete'],
				tasks: [
					{
						name: "build"
					}
				]
			}
		]
	}
};

jest.mock('chokidar');

const chokidar = require('chokidar');	

beforeEach(() => {
	jest.restoreAllMocks();
	chokidar.__reset();
});

describe('run() returns the correct status object', () => {
	test('when no targets specified', async () => {
		const config = {};

		const expectedResponse = {
			status: 'error',
			message: 'No watch targets specified.'
		};

		try{
			await samplePlugin().run(config, pluginOptions);
		} catch(e) {
			expect(e).toEqual(expectedResponse);
		}
	});


	test('when targets array is empty', async () => {
		const config = {
			targets: []
		};

		const expectedResponse = {
			status: 'error',
			message: 'No watch targets specified.'
		};

		try {
			await samplePlugin().run(config, pluginOptions);
		} catch(e) {
			expect(e).toEqual(expectedResponse);
		}
	});

	test('when watcher initialization fails', async () => {	
		const error = new Error('error');

		chokidar.__setWatchReturnValues([
			{
				paths: configs.singleTarget.targets[0].paths,
				error: error
			}
		]);

		const expectedResponse = {
			status: 'error',
			error: error
		};

		try {
			await samplePlugin().run(configs.singleTarget, pluginOptions);
		} catch(e) {
			expect(e).toEqual(expectedResponse);
		}
	});

	test('when there is one target', async () => {
		const expectedResponse = {
			status: 'running'
		};

		chokidar.__setWatchReturnValues([
			{
				paths: configs.singleTarget.targets[0].paths,
				watcher: chokidar.__createWatcher()
			}
		]);
		
		const response = await samplePlugin().run(configs.singleTarget, pluginOptions);
		expect(response).toEqual(expectedResponse);
	});

	test('when there are multiple targets', async () => {
		const expectedResponse = {
			status: 'running'
		};
		
		chokidar.__setWatchReturnValues([
			{
				paths: configs.multipleTargets.targets[0].paths,
				watcher: chokidar.__createWatcher()
			},
			{
				paths: configs.multipleTargets.targets[1].paths,
				watcher: chokidar.__createWatcher()
			}
		]);

		const response = await samplePlugin().run(configs.multipleTargets, pluginOptions);
		expect(response).toEqual(expectedResponse);
	});
});

describe('run() performs watcher initialization correctly', () => {
	const expectedWatcherOptions = {ignoreInitial: true};

	beforeEach(() => {
		jest.spyOn(chokidar, 'watch');
	});

	test('when there is one target', async () => {
		const expectedPaths = configs.singleTarget.targets[0].paths;

		chokidar.__setWatchReturnValues([
			{
				paths: expectedPaths,
				watcher: chokidar.__createWatcher()
			}
		]);

		await samplePlugin().run(configs.singleTarget, pluginOptions);
		expect(chokidar.watch.mock.calls.length).toEqual(1);
		expect(chokidar.watch.mock.calls[0]).toEqual([expectedPaths, expectedWatcherOptions]);
	});

	test('when there are multiple targets', async () => {
		const expectedPaths1 = configs.multipleTargets.targets[0].paths
		const expectedPaths2 = configs.multipleTargets.targets[1].paths

		chokidar.__setWatchReturnValues([
			{
				paths: expectedPaths1,
				watcher: chokidar.__createWatcher()
			},
			{
				paths: expectedPaths2,
				watcher: chokidar.__createWatcher()
			}
		]);

		await samplePlugin().run(configs.multipleTargets, pluginOptions);
		expect(chokidar.watch.mock.calls.length).toEqual(2);
		expect(chokidar.watch.mock.calls[0]).toEqual([expectedPaths1, expectedWatcherOptions]);
		expect(chokidar.watch.mock.calls[1]).toEqual([expectedPaths2, expectedWatcherOptions]);
	});
});

describe('run() closes watchers correctly', () => {
	test('when initialization fails for one of multiple watchers', async () => {
		const watcher1 = chokidar.__createWatcher();
		jest.spyOn(watcher1, 'close');

		chokidar.__setWatchReturnValues([
			{
				paths: configs.multipleTargets.targets[0].paths,
				watcher: watcher1
			},
			{
				paths: configs.multipleTargets.targets[1].paths,
				error: new Error('error')
			}
		]);

		try {
			await samplePlugin().run(configs.multipleTargets, pluginOptions);
		} catch(e) {
			expect(watcher1.close.mock.calls.length).toEqual(1);
		}
	});
});

describe('run() runs task', () => {
	const expectedWatcherOptions = {ignoreInitial: true};
	const filepath = 'filepath.js';

	const taskToRun = configs.singleTarget.targets[0].tasks[0];
	const expectedTaskName = taskToRun.name;
	const expectedTaskOptions = {
			subTasksToInclude: taskToRun.subTasks, 
			source: {
				filepath
			}
		};

	const skelApi = {
		runTask: jest.fn()
	};

	beforeEach(() => {
		jest.resetAllMocks();
		
		chokidar.__setWatchReturnValues([
			{
				paths: configs.singleTarget.targets[0].paths,
				watcher: chokidar.__createWatcher()
			}
		]);
	});

	test('when file is added', async () => {
		await samplePlugin().run(configs.singleTarget, pluginOptions, skelApi);
		chokidar.__fireEvent('add', filepath);
		expect(skelApi.runTask.mock.calls.length).toEqual(1);
		expect(skelApi.runTask.mock.calls[0]).toEqual([expectedTaskName, expectedTaskOptions]);
	});

	test('when file is changed', async () => {
		await samplePlugin().run(configs.singleTarget, pluginOptions, skelApi);
		chokidar.__fireEvent('change', filepath);
		expect(skelApi.runTask.mock.calls.length).toEqual(1);
		expect(skelApi.runTask.mock.calls[0]).toEqual([expectedTaskName, expectedTaskOptions]);
	});

	test('when file is deleted', async () => {
		await samplePlugin().run(configs.singleTarget, pluginOptions, skelApi);
		chokidar.__fireEvent('unlink', filepath);
		expect(skelApi.runTask.mock.calls.length).toEqual(1);
		expect(skelApi.runTask.mock.calls[0]).toEqual([expectedTaskName, expectedTaskOptions]);
	});
});

describe('run() does not run task', () => {
	const expectedWatcherOptions = {ignoreInitial: true};
	const filepath = 'filepath.js';

	const skelApi = {
		runTask: jest.fn()
	};

	beforeEach(() => {
		jest.resetAllMocks();
		
		chokidar.__setWatchReturnValues([
			{
				paths: configs.singleTarget.targets[0].paths,
				watcher: chokidar.__createWatcher()
			}
		]);
	});

	test('when an ignored event occurs on a file', async () => {
		const config = {
			targets: [
				{
					name: "target1",
					paths: "source/*.*",
					events: ['change', 'delete'],
					tasks: [
						{
							name: "build"
						}
					]
				}
			]
		};

		await samplePlugin().run(config, pluginOptions, skelApi);
		chokidar.__fireEvent('add', filepath);
		expect(skelApi.runTask).not.toHaveBeenCalled();
	});
});