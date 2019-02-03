import { Node, Identifier } from './';

export enum VariableDeclarationType {
	Variable,
	Function
}

export class VariableDeclaration extends Node {
	type: string = 'VariableDeclaration';

	constructor(
		readonly name: Identifier,
		readonly declType: VariableDeclarationType = VariableDeclarationType.Variable
	) {
		super();
	}

	emit(indent: number): string {
		return this.name.emit(indent);
	}
}
