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

export class LetItem extends Expression {
	type = 'LetItem';

	constructor(public readonly identifier: string, readonly initializer?: Expression) {
		super()
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
		return  `${tabs(indent)}(${this.identifier} ${this.emitInitializer(indent)})`
	}
}
