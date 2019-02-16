require('source-map-support').install();

import program from 'commander'
import { compile } from './compile'
import { initNewProject } from './projectCreation';
const packageInfo = require('../package.json')

program
	.version(packageInfo.version)

program
	.command('init <projectName>')
	.description('Initializes a new project in the current directory')
	.action((projectName) => {
		initNewProject(projectName)
	})

program
	.option('<projectFile>', 'Path to a TypeScript project file')
	.action((projectFile) => {
		compile(projectFile)
	})

program.parse(process.argv)

if (program.args.length === 0) {
	compile('./tsconfig.json')
}
