import * as ts from 'typescript'
import * as process from 'process'
import * as fs from 'fs';
import * as path from 'path'
import * as shell from 'shelljs'

import { compileSources } from './compiler'
import { isArray } from 'util';

export interface ProjectConfig {
	includeFolder: string
	outputFolder?: string
}

export function loadProjectFile(filePath: string) {
	const content = fs.readFileSync(filePath).toString()
	return JSON.parse(content) as ProjectConfig
}

export function loadInputFiles(config: ProjectConfig) {
	const files = fs.readdirSync(config.includeFolder)
	let ret = []
	for (const filePath of files) {
		ret.push({
			filename: filePath,
			contents: fs.readFileSync(filePath).toString()
		})
	}
	return ret
}

function convertConfigToCompilerOptions(opts: any) {
	let parsed = ts.parseJsonConfigFileContent({
		compilerOptions: opts,
		// if files are not specified then parseJsonConfigFileContent
		// will use ParseConfigHost to collect files in containing folder
		files: []
	},
	undefined as any,
	undefined as any);
	return parsed.options
}

function createParseConfigHost(): ts.ParseConfigHost {
	return {
		useCaseSensitiveFileNames: true,
		readDirectory: (rootDir: string, extensions: ReadonlyArray<string>, excludes: ReadonlyArray<string> | undefined, includes: ReadonlyArray<string>, depth?: number) => {
			return fs.readdirSync(rootDir)
		},
		fileExists: (path: string) => {
			return fs.existsSync(path)
		},
		readFile: (path: string) => {
			return fs.readFileSync(path).toString()
		}
	}
}

function readConfig(cp: string) {
	const configPath = ts.findConfigFile(
		/*searchPath*/ path.dirname(cp),
		ts.sys.fileExists,
		"tsconfig.json"
	)!;

	console.log("==-- Loading project from: " + configPath)
	const configText = fs.readFileSync(configPath).toString()
	const baseName = path.basename(configPath)
	const basePath = path.dirname(configPath)
	const configJson = ts.parseConfigFileTextToJson(baseName, configText)

	return ts.convertCompilerOptionsFromJson(configJson.config.compilerOptions, basePath).options
}

export function createProgramFromDir(cp: string) {
	const configDir = path.dirname(cp)
	const config = readConfig(cp)

	const allFiles: string[] = []

	if (config.typeRoots) {
		for (const typeRoot of config.typeRoots) {
			const dirResult = fs.readdirSync("./" + typeRoot)
			for (const typeFile of dirResult) {
				allFiles.push(path.join(typeRoot, typeFile))
			}
		}
	}

	const rootDir = config.rootDir ? "./" + config.rootDir : "./"
	fs.readdirSync(rootDir)
		.map(x => path.join(rootDir, x))
		.forEach(x => allFiles.push(x))

	console.log("   -> Project files: ", allFiles)

	const program = ts.createProgram(allFiles, config)

	const programFiles = program.getSourceFiles()
	for (const file of programFiles) {
		console.log("   |-> Program files: " + file.fileName)
	}

	return program

}

export interface InputFile {
	filename: string
	contents: string
}

function ensurePathExists(pathString: string) {
	shell.mkdir('-p', pathString)
}

function filterTypeScriptFiles(files: string[]) {
	const ret = []
	for (const file of files) {
		const extension = path.extname(file)
		if (extension === '.ts') {
			ret.push(file)
		}
	}
	return ret
}

export interface ElispFile {
	content: string
	fileName: string
}

export interface CompilationResult {
	elispFiles: ElispFile[]
}

export function appendCompilationResult(to: CompilationResult, append: CompilationResult) {
	return {
		elispFiles: to.elispFiles.concat(append.elispFiles)
	}
}

export function compileProject(program: ts.Program): CompilationResult {
	const result = compileSources(program)

	const elispFiles = []

	for (const file of result) {
		const fileName = path.basename(file.sourceFileName).split('.')[0] + '.el'

		elispFiles.push({
			content: file.output,
			fileName: fileName
		})
	}
	return {
		elispFiles
	}
}

export function writeCompilationResultToStorage(program: ts.Program, result: CompilationResult) {
	const outputDir = program.getCompilerOptions().outDir!
	if (outputDir) {
		ensurePathExists(outputDir)
		for (const file of result.elispFiles) {
			const outputFilePath = path.join(outputDir, file.fileName)
			//console.log('          ' + file.content)
			const lexicalBindingDeclaration = ";; -*- lexical-binding: t -*-\n\n"
			const output = lexicalBindingDeclaration + file.content
			fs.writeFile(outputFilePath, output, { flag: 'w' }, (err) => {
				if (err) {
					console.error(`Error writing file ${file.fileName}, error: ${err}`)
				}
			})
		}
	}
}

export function addFileToResult(result: CompilationResult, filePath: string) {
	const fileContent = fs.readFileSync(filePath).toString()
	const outputFileName = path.basename(filePath).split('.')[0] + '.el'
	result.elispFiles.push({
		content: fileContent,
		fileName: outputFileName
	})
}
