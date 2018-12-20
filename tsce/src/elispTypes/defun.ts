import { Block, tabs } from "./";

function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export class Defun extends Block {
	type = 'Function';

	constructor(identifier: string, readonly args: string[]) {
		super(identifier);
	}

	hyphenateName() {
		let ret = ""
		for (const char of this.identifier) {
			if (isUpper(char)) {
				ret += "-" + char.toLowerCase()
			} else {
				ret += char
			}
		}
		return ret
	}

	emitArgs() {
		return this.args.reduce((prev, curr) => prev + " " + curr, "")
	}

	emit(indent: number) {
		return `${tabs(indent)}(cl-defun ${this.hyphenateName()} (${this.emitArgs()})
${this.emitBlock(indent + 1, this.emitBody(indent+2))}
${tabs(indent)})`
	}
}
