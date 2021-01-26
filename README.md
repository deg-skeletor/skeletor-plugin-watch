# skeletor-plugin-watch
![Run Tests](https://github.com/deg-skeletor/skeletor-plugin-watch/workflows/Run%20Tests/badge.svg)

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
