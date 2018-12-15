import { Scope, Expression, tabs } from ".";

export class LetBinding extends Scope {
	type = 'LetBinding';

	constructor(readonly bindings: LetItem[]) {
		super([])
	}

	emitWithBody(indent: number, bodyEmittor: (indent: number) => string) {
		let bindings = '';

		for (let i = 0; i < this.bindings.length; i++) {
			const binding = this.bindings[i]
			bindings += binding.emit(i == 0 ? 0 : indent + 1);
		}
		let body = bodyEmittor(indent+1)

		return `${tabs(indent)}(let (${bindings})
${body}
${tabs(indent)})`;
	}

	emit(indent: number) {
		return this.emitWithBody(indent, () => this.emitBody(indent+1))
	}
}

function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export class LetItem extends Expression {
	type = 'LetItem';

	constructor(public readonly identifier: string, readonly initializer?: Expression) {
		super()
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
		console.log("REEEET: " + ret)
		return ret
	}

	emitInitializer(indent: number) {
		if (this.initializer) {
			const isBig = this.initializer.isBig()
			const actualIndent = isBig ? indent + 1 : 0
			return (isBig ? "\n" : "") +  this.initializer.emit(actualIndent)
		} else {
			return ""
		}
	}

	emit(indent: number) {
		return  `${tabs(indent)}(${this.hyphenateName()} ${this.emitInitializer(indent)})`
	}
}
