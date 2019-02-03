import { Block, Node, tabs, hyphenate, Identifier } from "./";

export class FunctionArg extends Node {
	type: string = "FunctionArg"

	constructor(readonly name: Identifier) {
		super()
	}

	emit(indent: number) {
		return this.name.emit(indent)
	}
}

export class Defun extends Block {
	type = 'Function';

	private customForm?: string
	private isInteractive?: boolean

	constructor(identifier: Identifier, readonly args: FunctionArg[], body: Node[]) {
		super(identifier, body);

		/*if (compilerDirectives && compilerDirectives.length > 0) {
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
		}*/
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
