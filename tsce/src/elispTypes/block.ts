import { Scope, tabs, Identifier } from ".";

/** Defines a scope which can be returned from, like a function */
export class Block extends Scope {
	type: string = 'Block'

	idNumber: number

	constructor(protected readonly identifier: Identifier) {
		super([])
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
