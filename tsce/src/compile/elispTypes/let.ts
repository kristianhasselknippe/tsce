import { Scope, Expression, tabs, Identifier, Node } from ".";
import { Declaration } from "./declaration";
import { hyphenate } from "./utils";

export class LetBinding extends Scope {
	type = 'LetBinding';

	constructor(readonly bindings: LetItem[], readonly inRootScope = false) {
		super()
	}

	getDeclarations(): (Node & Declaration)[] {
		return this.bindings
	}

	toString() {
		return 'LetBinding(' + this.bindings.length + ')'
	}

	emitInRootScope(indent: number) {
		let ret = ''
		for (const binding of this.bindings) {
			ret += binding.emitInRootScope(indent) + "\n"
		}
		return ret
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

		return `${tabs(indent)}${quotation}(lexical-let (${bindings})
${body}
${tabs(indent)})`;
	}

	emitQuoted(indent: number) {
		if (this.inRootScope) {
			return this.emitInRootScope(indent)
		}
		return this.emitWithBody(indent, () => this.emitBody(indent+1), true)
	}

	emit(indent: number) {
		if (this.inRootScope) {
			return this.emitInRootScope(indent)
		}
		return this.emitWithBody(indent, () => this.emitBody(indent+1), false)
	}
}

export class LetItem extends Expression implements Declaration {
	type = 'LetItem';

	constructor(public readonly identifier: Identifier, readonly initializer?: Expression, readonly isInRootScope = false) {
		super()
	}

	isDeclaration(): this is Declaration {
		return true
	}

	matchesIdentifier(identifierName: string): boolean {
		return this.identifier.identifierName === identifierName
	}

	hyphenateName() {
		return hyphenate(this.identifier.identifierName)
	}

	emitInRootScope(indent: number){
		return `${tabs(indent)}(setf ${this.hyphenateName()} ${this.emitInitializer(0)})`
	}

	emitInitializer(indent: number) {
		if (this.initializer) {
			return this.initializer.emit(indent + 1)
		} else {
			return ""
		}
	}

	emit(indent: number) {
		if (this.isInRootScope) {
			return this.emitInRootScope(indent)
		}
		return `${tabs(indent)}(${this.hyphenateName()} ${this.emitInitializer(indent)})`
	}
}
