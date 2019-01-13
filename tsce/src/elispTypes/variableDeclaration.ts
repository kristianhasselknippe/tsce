import { Node, Identifier } from './'
import { Declaration } from './declaration';

export class VariableDeclaration extends Node implements Declaration {
	type: string = "VariableDeclaration"

	constructor(readonly name: Identifier) {
		super()
	}

	isDeclaration(): this is Declaration {
		return true
	}

	matchesIdentifier(identifierName: string): boolean {
		return this.name.identifierName === identifierName
	}

	emit(indent: number): string {
		return this.name.emit(indent)
	}
}
