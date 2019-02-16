import { Lambda, Identifier, Scope, Block, RootScope, ElementIndexer, ArrayIndexer, StringIndexer, StringLiteral, PropertyAccess, Defun } from './'

export abstract class Node {
	abstract type: string
	abstract emit(indent: number): string

	emitUnquoted(indent: number){
		return this.emit(indent)
	}

	emitQuoted(indent: number): string {
		return this.emit(indent)
	}

	isFunctionDeclaration(): this is Defun {
		return false
	}

	isRootScope(): this is RootScope {
		return this.type === 'RootScope'
	}

	isPropertyAccess(): this is PropertyAccess { return false }

	isStringLiteral(): this is StringLiteral {
		return false
	}

	isLambda(): this is Lambda {
		return this.type === 'Lambda'
	}

	isIdentifier(): this is Identifier {
		return this.type === 'Identifier'
	}

	isScope(): this is Scope {
		return false
	}

	isBlock(): this is Block {
		return false
	}

	isElementIndexer(): this is ElementIndexer {
		return false
	}

	isArrayIndexerVariableDeclarationIndexer() {
		return false
	}

	isStringIndexer(): this is StringIndexer {
		return false
	}
}
