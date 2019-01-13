import { Statement, tabs, StringLiteral, Identifier, Node, Scope, VariableIdentifier } from '.';
import { Declaration } from './declaration';
import { VariableDeclaration } from './variableDeclaration';

export class ModuleImport extends Scope {
	type: string = 'ModuleImport';

	constructor(
		readonly moduleString: StringLiteral,
		readonly items: VariableDeclaration[],
		readonly isRelativePath: boolean
	) {
		super();
	}

	getDeclarations(): (Node & Declaration)[] {
		return this.items
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

export class NamespaceImport extends Scope implements Declaration {
	type: string = 'ModuleImport';

	constructor(
		readonly namespaceObjectIdentifier: VariableIdentifier,
		moduleString: StringLiteral,
		isRelativePath: boolean
	) {
		super()
	}

	getDeclarations(): (Node & Declaration)[] {
		return [this]
	}

	isDeclaration(): this is Declaration {
		return true
	}

	matchesIdentifier(identifierName: string): boolean {
		return identifierName === this.namespaceObjectIdentifier.identifierName
	}
}
