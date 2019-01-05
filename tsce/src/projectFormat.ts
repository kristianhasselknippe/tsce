import * as ts from 'typescript'
import * as process from 'process'
import * as fs from 'fs';
import * as path from 'path'
import * as shell from 'shelljs'

import { Project } from 'ts-simple-ast'

function ensurePathExists(pathString: string) {
	shell.mkdir('-p', pathString)
}

export interface TsceProject {
	project: Project
}

export function loadProject(pathToTsConfig: string): TsceProject {
	return {
		project: new Project({
			tsConfigFilePath: pathToTsConfig
		})
	}
}

export function writeCompilationResultToStorage(project: TsceProject) {
	const outputDir = project.project.getCompilerOptions().outDir
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
