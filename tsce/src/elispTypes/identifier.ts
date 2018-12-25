import { Expression, tabs } from ".";
import { Symbol } from "../context";
import { CompilerDirective } from "./compilerDirective";

function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export class Identifier extends Expression {
	type = 'Identifier';

	private isPredicate = false
	private customName?: string

	constructor(public readonly identifierName: string, readonly symbol: Symbol, readonly declarationDirectives: CompilerDirective[]) {
		super();

		for (const compDir of declarationDirectives) {
			switch (compDir.kind) {
				case "Name":
					this.customName = compDir.name
					break
				case "Predicate":
					this.isPredicate = true
					break
			}
		}
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

	formatName() {
		if (this.customName) {
			return this.customName
		} else {
			let ret = this.hyphenateName()
			if (this.isPredicate) {
				ret += "?"
			}
			return ret
		}
	}

	emit(indent: number) {
		return `${tabs(indent)}${this.formatName()}`
	}

	emitQuoted(indent: number) {
		return tabs(indent) + "'" + this.emit(0)
	}
}
