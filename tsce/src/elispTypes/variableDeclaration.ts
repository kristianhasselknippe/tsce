import { Node, Identifier } from './';
import { Declaration } from './declaration';

export enum VariableDeclarationType {
	Variable,
	Function
}

export class VariableDeclaration extends Node implements Declaration {
	type: string = 'VariableDeclaration';

	constructor(
		readonly name: Identifier,
		readonly declType: VariableDeclarationType = VariableDeclarationType.Variable
	) {
		super();
	}

	isDeclaration(): this is Declaration {
		return true;
	}

	isVariableDeclaration(): this is VariableDeclaration {
		return true;
	}

	matchesIdentifier(identifierName: string): boolean {
		return this.name.identifierName === identifierName;
	}

	emit(indent: number): string {
		return this.name.emit(indent);
	}
}
