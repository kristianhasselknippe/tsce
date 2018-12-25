import * as fs from 'fs';
import * as path from 'path'
import { compileProject, startProjectFromWorkingDir, writeCompilationResultToStorage, addFileToResult, appendCompilationResult, startProjectFromDir } from './projectFormat';

function parseCliArguments() {
	const args = process.argv.slice(2)

	if (args.length === 0) {
		console.error('Expecting file as first argument');
	}

	const pathExtension = path.parse(args[0])
	if (pathExtension.ext !== ".tsceproj") {
		console.error("Expected a tsceproj file as only argument")
	}

	return {
		projectPath: args[0]
	}
}




let cliArgs = parseCliArguments()

//compile ts-lib
console.log("== Compiling ts-lib")
const pathToTsLib = path.join(__dirname, '../ts-lib')
const tsLibCompilerProject = startProjectFromDir("config.tsceproj", pathToTsLib)


console.log("== Compiling project")
const compilerProject = startProjectFromWorkingDir(cliArgs.projectPath)
const projectResults = compileProject([tsLibCompilerProject, compilerProject])

const results = projectResults

//TODO: Make sure this works after we've packaged the code
const libPath = path.join(__dirname, '../src', 'ts-lib.el')
addFileToResult(results, libPath)

console.log("== Writing result")
writeCompilationResultToStorage(compilerProject, results)
