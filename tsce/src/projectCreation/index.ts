import * as process from "process"
import * as fs from "fs"
import * as path from "path"
const tsconfigTemplate = require('../../assets/tsconfigTemplate.json')

function writeTsConfigFile() {
	const workingDir = process.cwd()
	const tsconfigPath = path.join(workingDir, "tsconfig.json")
	fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigTemplate))
}

export function initNewProject(projectName: string) {
	const workingDir = process.cwd()
	writeTsConfigFile()

	const srcFolderName = 'src'
	const distFolderName = 'dist'
	fs.mkdirSync(path.join(workingDir, srcFolderName))
	fs.mkdirSync(path.join(workingDir, distFolderName))

	fs.writeFileSync(path.join(workingDir, srcFolderName, `${projectName}.ts`), "function main() {\n    console.log(\'Hello World\')\n}")
}
