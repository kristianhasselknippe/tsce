import * as fs from 'fs';
import * as path from 'path';
import {
	compileProject,
	writeCompilationResultToStorage,
	addFileToResult,
	appendCompilationResult,
	createProgramFromDir
} from './projectFormat';

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
const compilerProgram = createProgramFromDir(cliArgs.projectPath);

const projectResults = compileProject(compilerProgram);

const results = projectResults;

//TODO: Make sure this works after we've packaged the code
const libPath = path.join(__dirname, '../src', 'ts-lib.el');
addFileToResult(results, libPath);

console.log('== Writing result');
writeCompilationResultToStorage(compilerProgram, results);
