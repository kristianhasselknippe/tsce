import { tabs, Node, StringLiteral, Expression } from '.';
import { VariableDeclaration } from './variableDeclaration';

export class ModuleImport extends Expression {
	type: string = 'ModuleImport';

	constructor(
		readonly moduleString: StringLiteral,
		readonly items: VariableDeclaration[],
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

export class NamespaceImport extends Expression {
	type: string = 'NamespaceImport';

	constructor(
		readonly namespaceObjectIdentifier: VariableDeclaration,
		readonly moduleString: StringLiteral,
		readonly isRelativePath: boolean
	) {
		super();
	}

	emit(indent: number): string {
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
