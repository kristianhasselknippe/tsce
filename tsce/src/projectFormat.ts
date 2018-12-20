import * as process from 'process'
import * as fs from 'fs';
import * as path from 'path'

import { compileSource } from './compiler'

export interface ProjectConfig {
	includeFolder: string
	outputFolder: string
}

export function loadProjectFile(filePath: string) {
	const content = fs.readFileSync(filePath).toString()
	return JSON.parse(content) as ProjectConfig
}

export interface ProcessInfo {
	workingDir: path.ParsedPath
	configPath: string
	config: ProjectConfig
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

export function startProcess(configPath: string) {
	const workingDir = path.parse(process.cwd())
	return {
		workingDir,
		configPath: configPath,
		config: loadProjectFile(configPath)
	} as ProcessInfo
}

export interface InputFile {
	filename: string
	contents: string
}

function getFullPathToIncludeDir(process: ProcessInfo) {
	const configPath = path.parse(process.configPath)
	const workingDirString = path.format(process.workingDir)
	return path.join(workingDirString, configPath.dir, process.config.includeFolder)
}

function getFullPathToOutputDir(process: ProcessInfo) {
	const configPath = path.parse(process.configPath)
	const workingDirString = path.format(process.workingDir)
	return path.join(workingDirString, configPath.dir, process.config.outputFolder)
}

function filterTypeScriptFiles(files: string[]) {
	const filesToCompile = []
	for (const file of files) {
		const extension = path.extname(file)
		if (extension === '.ts' &&
			file.indexOf('.d.ts') === -1) {
			filesToCompile.push(file)
		}
	}
	return filesToCompile
}

function getFilesToCompile(process: ProcessInfo) {
	const fullIncludeDirPath = getFullPathToIncludeDir(process)
	console.log('Full path to include folder: ' + fullIncludeDirPath)
	const files = fs.readdirSync(fullIncludeDirPath)
	console.log('Files in include dir', files)

	return filterTypeScriptFiles(files.map(x => path.join(fullIncludeDirPath, x)))
}

export interface ElispFile {
	content: string
	fileName: string
}

export interface CompilationResult {
	elispFiles: ElispFile[]
}

export function compileProject(process: ProcessInfo): CompilationResult {
	const filesToCompile = getFilesToCompile(process)
	console.log('Files to compile', filesToCompile)

	const elispFiles = []
	for (const file of filesToCompile) {
		const content = fs.readFileSync(file).toString()
		const fileName = path.basename(file).split('.')[0] + '.el'
		const elispSource = compileSource(content)
		elispFiles.push({
			content: elispSource,
			fileName: fileName
		})
	}
	return {
		elispFiles
	}
}

export function writeCompilationResultToStorage(process: ProcessInfo, result: CompilationResult) {
	const outputDir = getFullPathToOutputDir(process)
	for (const file of result.elispFiles) {
		const outputFilePath = path.join(outputDir, file.fileName)
		console.log('Writing out file to: ' + outputFilePath)
		//console.log('          ' + file.content)
		fs.writeFile(outputFilePath, file.content, { flag: 'w' }, (err) => {
			console.log(`Done writing file ${file.fileName}, error: ${err}`)
		})
	}
}

export function addFileToResult(result: CompilationResult, filePath: string) {
	console.log('FilePath: ' + filePath)
	const fileContent = fs.readFileSync(filePath).toString()
	const outputFileName = path.basename(filePath).split('.')[0] + '.el'
	result.elispFiles.push({
		content: fileContent,
		fileName: outputFileName
	})
}
