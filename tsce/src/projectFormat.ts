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
	config: ProjectConfig
}

export function startProcess(configPath: string) {
	const workingDir = path.parse(process.cwd())
	return {
		workingDir,
		config: loadProjectFile(configPath)
	} as ProcessInfo
}

export interface InputFile {
	filename: string
	contents: string
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
