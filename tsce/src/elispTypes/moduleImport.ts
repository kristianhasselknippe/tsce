import { Statement, tabs, StringLiteral } from ".";

export class ModuleImport extends Statement {
	type: string = "ModuleImport"
	constructor(readonly moduleString: StringLiteral) {
		super()
	}

	emit(indent: number) {
		return `${tabs(indent)}(load ${this.moduleString.emit(0)}})\n`
	}
}
