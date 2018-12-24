import { Block, tabs, hyphenate } from "./";
import { CompilerDirective, extractCompilerDirectivesFromString } from "./compilerDirective";

export class Defun extends Block {
	type = 'Function';

	private isPredicate = false
	private customName?: string
	private customForm?: string
	//private usesNamedArguments = false

	constructor(identifier: string, readonly args: string[], comments?: string[]) {
		super(identifier);

		if (comments) {
			const compilerDirectives = comments.map(x => extractCompilerDirectivesFromString(x)).reduce((prev, curr) => {
				return prev.concat(curr)
			})

			for (const compDir of compilerDirectives) {
				switch (compDir.kind) {
					case "Form":
						this.customForm = compDir.form
						break
					case "Name":
						this.customName = compDir.name
						break
					case "Predicate":
						this.isPredicate = true
						break
					case "NamedArguments":
						//this.usesNamedArguments = true
						throw new Error("Named arguments are currently not supported")
				}
			}
		}
	}

	hyphenateName() {
		return hyphenate(this.identifier)
	}

	emitArgs() {
		return this.args.reduce((prev, curr) => prev + " " + hyphenate(curr), "")
	}

	getName() {
		if (this.customName) {
			return this.customName
		} else {
			let ret = this.hyphenateName()
			if (this.isPredicate) {
				ret += "?"
			}
			return ret
		}
	}

	getForm() {
		if (this.customForm) {
			return this.customForm
		} else {
			return "cl-defun"
		}
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.getForm()} ${this.getName()} (${this.emitArgs()})
${this.emitBlock(indent + 1, this.emitBody(indent+2))}
${tabs(indent)})`
	}
}
