import { Scope, Block, Identifier, Node } from './'

export abstract class Expression extends Node {
	type: string = 'Expression';

	emit(indent: number) {
		return ""
	}

	emitAsString(indent: number) {
		return `(ts/to-string ${this.emit(indent)})`
	}
}
