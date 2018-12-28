import { Scope, Expression, tabs, Identifier } from ".";

export class LetBinding extends Scope {
	type = 'LetBinding';

	constructor(readonly bindings: LetItem[]) {
		super([])
	}

	toString() {
		return 'LetBinding(' + this.bindings.length + ')'
	}

	emitWithBody(indent: number, bodyEmittor: (indent: number) => string, quoted = false) {
		let bindings = '';

		for (let i = 0; i < this.bindings.length; i++) {
			const binding = this.bindings[i]
			if (quoted) {
				bindings += binding.emitQuoted(i == 0 ? 0 : indent + 1);
			} else {
				bindings += binding.emit(i == 0 ? 0 : indent + 1);
			}
		}
		let body = bodyEmittor(indent+1)

		let quotation = quoted ? ',' : ''

		return `${tabs(indent)}${quotation}(let (${bindings})
${body}
${tabs(indent)})`;
	}

	emitQuoted(indent: number) {
		return this.emit(indent, true)
	}

	emit(indent: number, quoted = false) {
		return this.emitWithBody(indent, () => this.emitBody(indent+1), quoted)
	}
}

function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export class LetItem extends Expression {
	type = 'LetItem';

	constructor(public readonly identifier: Identifier, readonly initializer?: Expression) {
		super()
	}

	hyphenateName() {
		return this.identifier.hyphenateName()
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
