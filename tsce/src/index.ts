import * as fs from 'fs';
import * as path from 'path'
import { compileProject, startProcess, writeCompilationResultToStorage, addFileToResult } from './projectFormat';

function parseCliArguments() {
	const args = process.argv.slice(2)
	console.log("Args: ", args)

	args.forEach(x => {
		console.log("Input: ", x)
	})

	if (args.length === 0) {
		console.error('Expecting file as first argument');
	}

	const pathExtension = path.parse(args[0])
	console.log('Config path name: ' + pathExtension.ext)
	if (pathExtension.ext !== ".tsceproj") {
		console.error("Expected a tsceproj file as only argument")
	}

	return {
		projectPath: args[0]
	}
}

let cliArgs = parseCliArguments()

const compilerProcess = startProcess(cliArgs.projectPath)
console.log("Compilerprocess: ", compilerProcess)

const results = compileProject(compilerProcess)

//TODO: Make sure this works after we've packaged the code
const libPath = path.join(__dirname, '../src', 'ts-lib.el')
addFileToResult(results, libPath)

writeCompilationResultToStorage(compilerProcess, results) 
