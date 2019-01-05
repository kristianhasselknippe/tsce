import * as fs from 'fs';
import * as path from 'path';
import { loadProject, compileProject } from './projectFormat';

function parseCliArguments() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error('Expecting file as first argument');
	}

	const pathExtension = path.parse(args[0]);

	return {
		projectPath: args[0]
	};
}

let cliArgs = parseCliArguments();

console.log('== Compiling project');
const compilerProgram = loadProject(cliArgs.projectPath);

const projectResults = compileProject(compilerProgram);

const results = projectResults;

//TODO: Add ts-lib.el

console.log('== Writing result');
writeCompilationResultToStorage(projectResults);
