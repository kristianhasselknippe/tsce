import * as fs from 'fs';
import * as path from 'path'
import { compileProject, startProjectFromWorkingDir, writeCompilationResultToStorage, addFileToResult, startProcessFromConfig, appendCompilationResult, startProjectFromDir } from './projectFormat';

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

//compile ts-lib
console.log("We are compiling ts-lib")
const pathToTsLib = path.join(__dirname, '../ts-lib')
console.log("111 path to ts lib", pathToTsLib)
const tsLibCompilerProject = startProjectFromDir("config.tsceproj", pathToTsLib)
const libResult = compileProject(tsLibCompilerProject)
console.log("123123 LIB results", libResult)

const compilerProject = startProjectFromWorkingDir(cliArgs.projectPath)
console.log("Compilerprocess: ", compilerProject)

const projectResults = compileProject(compilerProject)

const results = appendCompilationResult(projectResults, libResult)

//TODO: Make sure this works after we've packaged the code
const libPath = path.join(__dirname, '../src', 'ts-lib.el')
addFileToResult(results, libPath)

writeCompilationResultToStorage(compilerProject, results) 
