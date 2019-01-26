import * as fs from 'fs';
import * as path from 'path';
import { loadProject, writeCompilationResultToStorage } from './projectFormat';
import { compileProject } from './compiler';

function parseCliArguments() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error('Expecting file as first argument');
	}

	return {
		projectPath: args[0]
	};
}

let cliArgs = parseCliArguments();

console.log('== Compiling project: ' + cliArgs.projectPath);
console.log("    Working directory: " + process.cwd())
const project = loadProject(cliArgs.projectPath);

const projectResults = compileProject(project);

const results = projectResults;

//TODO: Add ts-lib.el
const libPath = path.join(__dirname, '../src', 'ts-lib.el');
const libContent = fs.readFileSync(libPath).toString()
results.push({
	fileName: 'ts-lib',
	source: libContent
})

console.log('== Writing result');
writeCompilationResultToStorage(project, results);
