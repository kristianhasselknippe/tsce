import { Statement, tabs, StringLiteral, Identifier } from '.';
import { Declaration } from './declaration';

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

export class NamespaceImport extends ModuleImport implements Declaration {
	constructor(
		readonly namespaceObjectIdentifier: Identifier,
		moduleString: StringLiteral,
		isRelativePath: boolean
	) {
		super(moduleString, isRelativePath);
	}

	matchesIdentifier(identifier: Identifier): boolean {
		return this.namespaceObjectIdentifier.matchesIdentifier(identifier)
	}

	isDeclaration() {
		return true
	}
}
