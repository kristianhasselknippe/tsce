import * as fs from 'fs';
import * as path from 'path'
import * as shell from 'shelljs'
import chalk from 'chalk'
import { Project } from 'ts-morph'
import { CompilationResult } from './compiler';

function ensurePathExists(pathString: string) {
	shell.mkdir('-p', pathString)
}

export interface TsceProject {
	project: Project
}

export function loadProject(pathToTsConfig: string): TsceProject {
	if (fs.existsSync(pathToTsConfig)) {
		return {
			project: new Project({
				tsConfigFilePath: pathToTsConfig
			})
		}
	} else {
		throw new Error("Could not locate project file: " + pathToTsConfig)
	}
}

export function writeCompilationResultToStorage(project: TsceProject, compilationResult: CompilationResult[]) {
	const outputDir = project.project.getCompilerOptions().outDir
	if (outputDir) {
		ensurePathExists(outputDir)
		for (const file of compilationResult) {
			const outputFilePath = path.join(outputDir, file.fileName + '.el')
			const lexicalBindingDeclaration = ";; -*- lexical-binding: t -*-\n\n"
			const output = lexicalBindingDeclaration + file.source
			console.log(chalk.green('    - Writing file: ') + outputFilePath)
			fs.writeFile(outputFilePath, output, { flag: 'w' }, (err) => {
				if (err) {
					console.error(`Error writing file ${file.fileName}, error: ${err}`)
				}
			})
		}
	}
}
