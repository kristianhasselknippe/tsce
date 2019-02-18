import { Block, Node, tabs, hyphenate, Identifier, Expression } from './';
import { CompilerDirective } from './compilerDirective';
import { NodeData } from '../parser';

export class FunctionArg extends Node {
	type: string = 'FunctionArg';

	constructor(readonly name: Identifier, readonly initializer?: Expression) {
		super();
		console.log("FUNCTION ARG: " + this.name.identifierName + ", ", this.initializer)
	}

	emit(indent: number) {
		if (typeof this.initializer !== 'undefined') {
			return `${tabs(indent)}(${this.name.emit(0)} ${this.initializer.emit(0)})`;
		}
		return this.name.emit(indent);
	}

	emitForLambda(indent: number) {
		return this.name.emit(indent);
	}
}

export class Defun extends Block {
	type = 'Function';

	private customForm?: string;
	private isInteractive?: boolean;

	constructor(
		identifier: Identifier,
		readonly args: FunctionArg[],
		readonly nodeData?: NodeData
	) {
		super(identifier);

		if (nodeData) {
			const compilerDirectives = nodeData.compilerDirectives;
			for (const compDir of compilerDirectives) {
				switch (compDir.kind) {
					case 'Form':
						this.customForm = compDir.form;
						break;
					case 'Interactive':
						this.isInteractive = true;
						break;
				}
			}
		}
	}

	matchesIdentifier(identifierName: string) {
		return this.identifier.identifierName === identifierName;
	}

	isFunctionDeclaration() {
		return true;
	}

	emitArgs() {
		const requiredArgs = [];
		const optionalArgs = [];
		for (const arg of this.args) {
			if (typeof arg.initializer !== 'undefined') {
				optionalArgs.push(arg);
			} else {
				requiredArgs.push(arg);
			}
		}
		return requiredArgs.reduce(
			(prev, curr) => prev + ' ' + curr.emit(0),
			''
		) +
			((optionalArgs.length > 0)
			? ' &optional ' +
					optionalArgs.reduce(
						(prev, curr) => prev + ' ' + curr.emit(0),
						''
					)
			 : '');
	}

	getForm() {
		if (this.customForm) {
			return this.customForm;
		} else {
			return 'cl-defun';
		}
	}

	emitInteractive(indent: number) {
		if (this.isInteractive) {
			return '\n' + tabs(indent) + '(interactive)';
		} else {
			return '';
		}
	}

	emit(indent: number) {
		if (this.nodeData && !this.nodeData.hasImplementation) {
			return '';
		}

		return `${tabs(indent)}(${this.getForm()} ${this.identifier.emit(
			0
		)} (${this.emitArgs()})${this.emitInteractive(indent + 1)}
${this.emitBlock(indent + 1, this.emitBody(indent + 2))}
${tabs(indent)})`;
	}
}
