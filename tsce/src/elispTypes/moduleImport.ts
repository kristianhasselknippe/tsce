import { tabs, Node, StringLiteral, Expression } from '.';
import { Declaration, DeclarationsSource } from './declaration';
import { VariableDeclaration } from './variableDeclaration';

export class ModuleImport extends Expression implements DeclarationsSource {
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

	isDeclarationsSource(): this is DeclarationsSource {
		return true
	}

	emit(indent: number) {
		if (this.isRelativePath) {
			return `${tabs(indent)}(load-file ${this.moduleString.emitWith(
				0,
				'.el'
)})\n`
		} else {
			/* TODO: We don't emit modules outside our own project.
			   This might not be enough in the future. */
			return ''
		}
	}
}

export class NamespaceImport extends Expression implements DeclarationsSource {
	type: string = 'NamespaceImport';

	constructor(
		readonly namespaceObjectIdentifier: VariableDeclaration,
		moduleString: StringLiteral,
		isRelativePath: boolean
	) {
		super()
	}

	emit(indent: number): string {
		return ''
	}

	isDeclarationsSource(): this is DeclarationsSource {
		return true
	}

	getDeclarations(): (Node & Declaration)[] {
		return [this.namespaceObjectIdentifier]
	}

	matchesIdentifier(identifierName: string): boolean {
		return this.namespaceObjectIdentifier.matchesIdentifier(identifierName)
	}
}
