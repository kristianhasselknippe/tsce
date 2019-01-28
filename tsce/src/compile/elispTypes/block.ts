import { Scope, tabs, Identifier, Node } from ".";

/** Defines a scope which can be returned from, like a function */
export abstract class Block extends Scope {
	type: string = 'Block'

	idNumber: number

	constructor(protected readonly identifier: Identifier, body: Node[] | Node) {
		super(body)
		this.idNumber = Math.floor(Math.random() * 100000)
	}

	isBlock() {
		return true
	}

	get blockId() {
		return "block" + this.idNumber + "-" + this.identifier.emit(0)
	}

	emitBlock(indent: number, body: string) {
		return `${tabs(indent)}(block ${this.blockId}
${body}
${tabs(indent)})`
	}
}
