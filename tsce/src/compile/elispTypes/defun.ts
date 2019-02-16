import { Block, Node, tabs, hyphenate, Identifier } from './';
import { CompilerDirective } from './compilerDirective';
import { NodeData } from '../parser';

export class FunctionArg extends Node {
	type: string = 'FunctionArg';

	constructor(readonly name: Identifier) {
		super();
	}

	emit(indent: number) {
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
			const compilerDirectives = nodeData.compilerDirectives
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
		return this.args.reduce((prev, curr) => prev + ' ' + curr.emit(0), '');
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
			return ''
		}
		
		return `${tabs(indent)}(${this.getForm()} ${this.identifier.emit(
			0
		)} (${this.emitArgs()})${this.emitInteractive(indent + 1)}
${this.emitBlock(indent + 1, this.emitBody(indent + 2))}
${tabs(indent)})`;
	}
}
