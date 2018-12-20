import * as process from 'process'
import * as fs from 'fs';
import * as path from 'path'

export interface ProjectConfig {
	includeFolder: string
	outputFile: string
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

export function compileProject(process: ProcessInfo) {
	const fullIncludeDirPath = getFullPathToIncludeDir(process)
	console.log('Full path to include folder: ' + fullIncludeDirPath)
	
}
