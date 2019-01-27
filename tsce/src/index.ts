import program from 'commander'
import { compile } from './compile'
import { initNewProject } from './projectCreation';
const packageInfo = require('../package.json')

program
	.version(packageInfo.version)
	.option('<projectPath>', 'Path to the TypeScript project file')
	.action((path) => {
		compile(path)
	})

program
	.command('init <projectName>')
	.description('Initializes a new project in the current directory')
	.action((projectName) => {
		initNewProject(projectName)
	})

program.parse(process.argv)
