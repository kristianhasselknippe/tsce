import { Expression, tabs, hyphenate } from ".";

export class Identifier extends Expression {
	type: string = 'Identifier';

	isPredicate = false
	customName?: string
	useNamedArguments = false

	constructor(public readonly identifierName: string) {
		super();

		/*if (declarationDirectives) {
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
		}*/
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
