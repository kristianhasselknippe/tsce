import * as fs from 'fs';
import * as path from 'path';
import { loadProject, writeCompilationResultToStorage } from './projectFormat';
import { compileProject } from './compiler';
import chalk from 'chalk'

function getTime() {
	const t = process.hrtime()
	return t[0] + t[1] / 1000000000.0
}

export function compile(projectPath: string) {
	const startTime = getTime()

	console.log(chalk.cyan('== Compiling project: ') + projectPath);
	const project = loadProject(projectPath);

	const diagnostics = project.project.getPreEmitDiagnostics()
	console.log(project.project.formatDiagnosticsWithColorAndContext(diagnostics))

	const projectResults = compileProject(project);
	const endTimeParse = getTime()

	const results = projectResults;

	const libPath = path.join(__dirname, '../../assets', 'ts-lib.el');
	const libContent = fs.readFileSync(libPath).toString()
	results.push({
		fileName: 'ts-lib',
		source: libContent
	})

	console.log(chalk.cyan('\n== Writing result'));
	writeCompilationResultToStorage(project, results);

	const endTimeWrite = getTime()

	const totalCompileTime = endTimeWrite - startTime
	const parseTime = endTimeParse - startTime

	const parseTimePercent = parseTime / totalCompileTime * 100.0

	console.log('\n')
	console.log(chalk.greenBright(`Compilation completed in ${totalCompileTime} seconds`))
	console.log(chalk.green(`    ${totalCompileTime} seconds (${parseTimePercent}%) spent parsing`))
}
