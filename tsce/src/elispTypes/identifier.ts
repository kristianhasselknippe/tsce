import { Expression, tabs } from ".";
import { Symbol } from "../context";

function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export class Identifier extends Expression {
	type = 'Identifier';

	constructor(public readonly identifierName: string, readonly symbol: Symbol) {
		super();
	}

	hyphenateName() {
		let ret = ""
		for (const char of this.identifierName) {
			if (isUpper(char)) {
				ret += "-" + char.toLowerCase()
			} else {
				ret += char
			}
		}
		return ret
	}

	emit(indent: number) {
		return `${tabs(indent)}${this.hyphenateName()}`
	}

	emitQuoted(indent: number) {
		return tabs(indent) + "'" + this.emit(0)
	}
}

