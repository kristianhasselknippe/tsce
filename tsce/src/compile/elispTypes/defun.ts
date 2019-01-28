import { Block, Node, tabs, hyphenate, Identifier } from "./";
import { CompilerDirective, extractCompilerDirectivesFromString } from "./compilerDirective";
import { Declaration } from "./declaration";

export class FunctionArg extends Node implements Declaration {
	type: string = "FunctionArg"

	constructor(readonly name: Identifier) {
		super()
	}

	isDeclaration(): this is Declaration {
		return true
	}

	matchesIdentifier(identifierName: string): boolean {
		return this.name.identifierName === identifierName
	}

	emit(indent: number) {
		return this.name.emit(indent)
	}
}

export class Defun extends Block implements Declaration {
	type = 'Function';

	private customForm?: string
	private isInteractive?: boolean

	constructor(identifier: Identifier, readonly args: FunctionArg[], body: Node[], compilerDirectives: CompilerDirective[]) {
		super(identifier, body);

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

	getDeclarations(): (Node & Declaration)[] {
		return this.args
	}

	isDeclaration() {
		return true
	}

	matchesIdentifier(identifierName: string) {
		return this.identifier.identifierName === identifierName
	}

	isFunctionDeclaration() {
		return true
	}

	emitArgs() {
		return this.args.reduce((prev, curr) => prev + " " + curr.emit(0), "")
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
