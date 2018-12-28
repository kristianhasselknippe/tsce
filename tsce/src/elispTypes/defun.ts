import { Block, tabs, hyphenate, Identifier } from "./";
import { CompilerDirective, extractCompilerDirectivesFromString } from "./compilerDirective";

export class Defun extends Block {
	type = 'Function';

	private customForm?: string

	constructor(identifier: Identifier, readonly args: string[], compilerDirectives: CompilerDirective[]) {
		super(identifier);

		if (compilerDirectives && compilerDirectives.length > 0) {
			for (const compDir of compilerDirectives) {
				switch (compDir.kind) {
					case "Form":
						this.customForm = compDir.form
						break
				}
			}
		}
	}

	hyphenateName() {
		return hyphenate(this.identifier.emit(0))
	}

	emitArgs() {
		return this.args.reduce((prev, curr) => prev + " " + hyphenate(curr), "")
	}

	getForm() {
		if (this.customForm) {
			return this.customForm
		} else {
			return "cl-defun"
		}
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.getForm()} ${this.identifier.emit(0)} (${this.emitArgs()})
${this.emitBlock(indent + 1, this.emitBody(indent+2))}
${tabs(indent)})`
	}
}
