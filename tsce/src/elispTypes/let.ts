import { Scope, Expression, tabs, Identifier } from ".";
import { Declaration } from "./declaration";

export class LetBinding extends Scope implements Declaration {
	type = 'LetBinding';

	constructor(readonly bindings: LetItem[], readonly inRootScope = false) {
		super()
	}

	matchesIdentifier(identifier: Identifier): boolean {
		for (const binding of this.bindings) {
			if (binding.matchesIdentifier(identifier)) {
				return true
			}
		}
		return false
    }

	isDeclaration() {
		return true
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

function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export class LetItem extends Expression implements Declaration {
	type = 'LetItem';

	constructor(public readonly identifier: Identifier, readonly initializer?: Expression, readonly isInRootScope = false) {
		super()
	}

	matchesIdentifier(identifier: Identifier): boolean {
        return identifier.matchesIdentifier(this.identifier)
    }

	isDeclaration() { return true }

	hyphenateName() {
		return this.identifier.hyphenateName()
	}

	emitInRootScope(indent: number){
		return `${tabs(indent)}(setf ${this.hyphenateName()} ${this.emitInitializer(0)})`
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
		if (this.isInRootScope) {
			return this.emitInRootScope(indent)
		}
		return `${tabs(indent)}(${this.hyphenateName()} ${this.emitInitializer(indent)})`
	}
}
