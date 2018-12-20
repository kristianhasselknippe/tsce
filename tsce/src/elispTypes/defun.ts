import { Block, tabs, hyphenate } from "./";

export class Defun extends Block {
	type = 'Function';

	constructor(identifier: string, readonly args: string[]) {
		super(identifier);
	}

	hyphenateName() {
		return hyphenate(this.identifier)
	}

	emitArgs() {
		return this.args.reduce((prev, curr) => prev + " " + hyphenate(curr), "")
	}

	emit(indent: number) {
		return `${tabs(indent)}(cl-defun ${this.hyphenateName()} (${this.emitArgs()})
${this.emitBlock(indent + 1, this.emitBody(indent+2))}
${tabs(indent)})`
	}
}
