import { Block, tabs, hyphenate, Identifier } from "./";
import { CompilerDirective, extractCompilerDirectivesFromString } from "./compilerDirective";

export class Defun extends Block {
	type = 'Function';

	private customForm?: string
	//private usesNamedArguments = false

	constructor(identifier: Identifier, readonly args: string[], comments?: string[]) {
		super(identifier);

		if (comments && comments.length > 0) {
			const compilerDirectives = comments.map(x => extractCompilerDirectivesFromString(x)).reduce((prev, curr) => {
				return prev.concat(curr)
			})

			for (const compDir of compilerDirectives) {
				switch (compDir.kind) {
					case "Form":
						this.customForm = compDir.form
						break
					case "NamedArguments":
						//this.usesNamedArguments = true
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
