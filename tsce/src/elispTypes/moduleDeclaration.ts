import { Node, tabs } from '.'

export class ModuleDeclaration extends Node {
	type: string = 'ModuleDeclaration'

	constructor(readonly name: string) {
		super()
	}

	emit(indent: number) {
		return `${tabs(indent)}(require '${this.name})`
	}
}
