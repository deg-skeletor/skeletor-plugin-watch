# skeletor-plugin-watch
[![Build Status](https://travis-ci.org/deg-skeletor/skeletor-plugin-watch.svg?branch=master)](https://travis-ci.org/deg-skeletor/skeletor-plugin-watch)

## Config
```js
{
	targets: [
		{
			name: "css",
			paths: "source/css/*.css",
			events: ['add', 'change', 'delete'],
			tasks: [
				{
					name: "build",
					subTasks: ["css"]
				}
			]
		},
		{
			name: "js",
			paths: "source/js/*.js",
			events: ['add', 'change', 'delete'],
			tasks: [
				{
					name: "build",
					subTasks: ["js"]
				}
			]
		}
	]
}
```
