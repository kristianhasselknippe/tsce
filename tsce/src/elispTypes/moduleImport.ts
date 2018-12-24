import { Statement, tabs, StringLiteral } from '.';

export class ModuleImport extends Statement {
	type: string = 'ModuleImport';

	constructor(
		readonly moduleString: StringLiteral,
		readonly isRelativePath: boolean
	) {
		super();
	}

	emit(indent: number) {
		if (this.isRelativePath) {
			return `${tabs(indent)}(load-file ${this.moduleString.emitWith(
				0,
				'.el'
			)})\n`;
		} else {
			/* TODO: We don't emit modules outside our own project.
			   This might not be enough in the future. */
			return '';
		}
	}
}
