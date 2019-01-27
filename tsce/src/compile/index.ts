import * as fs from 'fs';
import * as path from 'path';
import { loadProject, writeCompilationResultToStorage } from './projectFormat';
import { compileProject } from './compiler';

export function compile(projectPath: string) {
	console.log('== Compiling project: ' + projectPath);
	console.log("    Working directory: " + process.cwd())
	const project = loadProject(projectPath);

	const projectResults = compileProject(project);

	const results = projectResults;

	const libPath = path.join(__dirname, '../../assets', 'ts-lib.el');
	const libContent = fs.readFileSync(libPath).toString()
	results.push({
		fileName: 'ts-lib',
		source: libContent
	})

	console.log('== Writing result');
	writeCompilationResultToStorage(project, results);
}
