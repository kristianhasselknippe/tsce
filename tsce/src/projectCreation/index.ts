import * as process from "process"
import * as fs from "fs"
import * as path from "path"
const tsconfigTemplate = require('../../assets/tsconfigTemplate.json')

function writeTsConfigFile() {
	const tsconfigPath = path.join(process.cwd(), "tsconfig.json")
	fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigTemplate))
}

function createFolder(folderName: string) {
	const srcFolderPath = path.join(process.cwd(), folderName)
	if (!fs.existsSync(srcFolderPath)) {
		fs.mkdirSync(srcFolderPath)
	}
}

function includeSourceFileFromAssets(name: string, contentFileName: string) {
	const filePath = path.join(__dirname, '../../assets', contentFileName)
	const content = fs.readFileSync(filePath).toString()
	fs.writeFileSync(path.join(process.cwd(), './src', name), content)
}

export function initNewProject(projectName: string) {

	writeTsConfigFile()
	createFolder('src')
	createFolder('dist')

	includeSourceFileFromAssets(`${projectName}.ts`, 'helloWorldFile')
	includeSourceFileFromAssets(`emacs.d.ts`, 'emacs.d.ts')
}
