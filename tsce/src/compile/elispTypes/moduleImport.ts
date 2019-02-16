import { tabs, Node, StringLiteral, Expression, Identifier } from '.';

function pathIsAbsolute(modulePath: string) {
	return modulePath.indexOf(".") === -1
		&& modulePath.indexOf("/") === -1
		&& modulePath.indexOf("\\") === -1
}

export class ModuleImport extends Expression {
	type: string = 'ModuleImport';

	constructor(
		readonly moduleString: StringLiteral,
		readonly items?: Identifier[]
	) {
		super();
	}

	emit(indent: number) {
		if (pathIsAbsolute(this.moduleString.str)) {
			return ""
		}
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
		if (pathIsAbsolute(this.moduleString.str)) {
			return ""
		}
		return `${tabs(indent)}(load-file ${this.moduleString.emitWith(
0,
'.el'
)})\n`;
	}
}
