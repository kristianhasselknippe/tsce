import { Block, tabs, hyphenate } from "./";
import { CompilerDirective, extractCompilerDirectivesFromString } from "./compilerDirective";

export class Defun extends Block {
	type = 'Function';

	compilerDirectives?: CompilerDirective[]

	constructor(identifier: string, readonly args: string[], comments?: string[]) {
		super(identifier);

		if (comments) {
			this.compilerDirectives = comments.map(x => extractCompilerDirectivesFromString(x)).reduce((prev, curr) => {
				return prev.concat(curr)
			})
		}
	}

	hyphenateName() {
		return hyphenate(this.identifier)
	}

	emitArgs() {
		return this.args.reduce((prev, curr) => prev + " " + hyphenate(curr), "")
	}

	emit(indent: number) {
		return `${tabs(indent)}(cl-defun ${this.hyphenateName()} (${this.emitArgs()})
${this.emitBlock(indent + 1, this.emitBody(indent+2))}
${tabs(indent)})`
	}
}
