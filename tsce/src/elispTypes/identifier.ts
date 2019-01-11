import { Expression, tabs } from ".";
import { CompilerDirective } from "./compilerDirective";

function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export abstract class Identifier extends Expression {
	type: string = 'Identifier';

	isPredicate = false
	customName?: string
	useNamedArguments = false

	constructor(public readonly identifierName: string, readonly declarationDirectives?: CompilerDirective[]) {
		super();

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

	matchesIdentifierName(identifierName: string) {
		//console.log(`A(${identifierName}) -- B(${this.identifierName}): ${identifierName === this.identifierName}`)
		return identifierName === this.identifierName
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
		return `${tabs(indent)},${this.formatName()}`
	}

	emitUnquoted(indent: number){
		return `${tabs(indent)}\`${this.formatName()}`
	}
}

export class FunctionIdentifier extends Identifier {
	emitQuoted(indent: number) {
		console.log("123123 Emitting function ident: " + this.identifierName)
		return this.emit(indent)
	}
}

export class VariableIdentifier extends Identifier {
	
}
