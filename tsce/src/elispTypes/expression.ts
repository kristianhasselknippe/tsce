import { Scope, Block, Identifier, Node } from './'

//TODO Do we need expression yet? In elisp; everything is an expression, so perhaps just replace node?
export abstract class Expression extends Node {
	type: string = 'Expression';

	emitAsString(indent: number) {
		return `(ts/to-string ${this.emit(indent)})`
	}
}
