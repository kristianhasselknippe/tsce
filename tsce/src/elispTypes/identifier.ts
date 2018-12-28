import { Expression, tabs } from ".";
import { Symbol, SymbolType } from "../context";
import { CompilerDirective } from "./compilerDirective";

function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export class Identifier extends Expression {
	type = 'Identifier';

	isPredicate = false
	customName?: string
	useNamedArguments = false

	symbol: Symbol

	constructor(public readonly identifierName: string, symbol?: Symbol, readonly declarationDirectives?: CompilerDirective[]) {
		super();

		if (!symbol) {
			this.symbol = {
				name: this.identifierName,
				type: SymbolType.Variable
			}
		} else {
			this.symbol = symbol
		}

		if (declarationDirectives) {
			for (const compDir of declarationDirectives) {
				switch (compDir.kind) {
					case "Name":
						this.customName = compDir.name
						break
					case "Predicate":
						this.isPredicate = true
						break
					case "NamedArguments":
						this.useNamedArguments = true
						break
				}
			}
		}
	}

	referenceByQuote() {
		return this.symbol.type === SymbolType.Function
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
