import { Scope, tabs } from ".";

/** Defines a scope which can be returned from, like a function */
export class Block extends Scope {
	type: string = 'Block'

	idNumber: number

	constructor(protected readonly identifier: string) {
		super([])
		this.idNumber = Math.floor(Math.random() * 100000)
	}

	isBlock() {
		return true
	}

	get blockId() {
		return "block" + this.idNumber + "-" + this.identifier
	}

	emitBlock(indent: number, body: string) {
		return `${tabs(indent)}(block ${this.blockId}
${body}
${tabs(indent)})`
	}
}
