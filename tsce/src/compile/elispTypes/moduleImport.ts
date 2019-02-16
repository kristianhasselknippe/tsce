import { tabs, Node, StringLiteral, Expression, Identifier } from '.';

export class ModuleImport extends Expression {
	type: string = 'ModuleImport';

	constructor(
		readonly moduleString: StringLiteral,
		readonly items: Identifier[]
	) {
		super();
	}

	emit(indent: number) {
		return `${tabs(indent)}(load-file ${this.moduleString.emitWith(
0,
'.el'
)})\n`;
	}
}

export class NamespaceImport extends Expression {
	type: string = 'NamespaceImport';

	constructor(
		readonly namespaceObjectIdentifier: Identifier,
		readonly moduleString: StringLiteral,
	) {
		super();
	}

	emit(indent: number): string {
		return `${tabs(indent)}(load-file ${this.moduleString.emitWith(
0,
'.el'
)})\n`;
	}
}
