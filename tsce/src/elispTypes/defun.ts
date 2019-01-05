import { Block, tabs, hyphenate, Identifier } from "./";
import { CompilerDirective, extractCompilerDirectivesFromString } from "./compilerDirective";
import { Declaration } from "./declaration";

export class Defun extends Block implements Declaration {
	type = 'Function';

	private customForm?: string
	private isInteractive?: boolean

	constructor(identifier: Identifier, readonly args: string[], compilerDirectives: CompilerDirective[]) {
		super(identifier);

		if (compilerDirectives && compilerDirectives.length > 0) {
			for (const compDir of compilerDirectives) {
				switch (compDir.kind) {
					case "Form":
						this.customForm = compDir.form
						break
					case "Interactive":
						this.isInteractive = true
						break
				}
			}
		}
	}

	matchesIdentifier(identifier: Identifier): boolean {
		return identifier.matchesIdentifier(this.identifier)
	}

	isDeclaration() {
		return true
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

	emitInteractive() {
		return this.isInteractive ? "(interactive)" : ""
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.getForm()} ${this.identifier.emit(0)} (${this.emitArgs()})
${tabs(indent+1)}${this.emitInteractive()}
${this.emitBlock(indent + 1, this.emitBody(indent+2))}
${tabs(indent)})`
	}
}
