import { Expression, tabs, hyphenate } from ".";
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

	formatName() {
		if (this.customName) {
			return this.customName
		} else {
			let ret = hyphenate(this.identifierName)
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
		return this.emit(indent)
	}

	isFunctionIdentifier(): this is FunctionIdentifier {
		return true
	}
}

export class VariableIdentifier extends Identifier {
	
}
