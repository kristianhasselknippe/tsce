import { Expression, tabs, hyphenate } from '.';
import { NodeData, SymbolType } from '../parser';
import { SymbolTable } from '../symbolTable';
import chalk from 'chalk'
import { CompilerDirective } from './compilerDirective';

export class Identifier extends Expression {
	type: string = 'Identifier';

	isPredicate = false;
	customName?: string;
	useNamedArguments = false;

	constructor(
		readonly identifierName: string,
		readonly compilerDirectives?: CompilerDirective[]
	) {
		super();

		if (this.compilerDirectives) {
			for (const compDir of this.compilerDirectives) {
				console.log(chalk.blueBright("COMPILER DIRECTIVE: " + compDir.kind))
				switch (compDir.kind) {
					case "Name":
						console.log("IDENTIFIER NAME: " + this.identifierName) 
						console.log(chalk.blueBright("GOT CUSTOM NAME: " + compDir.name))
						this.customName = compDir.name
						break
					case "Predicate":
						this.isPredicate = true
						break
					case "NamedArguments":
						this.useNamedArguments = true
						break
				}
			}
		}
	}

	formatName() {
		if (this.customName) {
			return this.customName;
		} else {
			let ret = hyphenate(this.identifierName);
			if (this.isPredicate) {
				ret += '?';
			}
			return ret;
		}
	}

	emit(indent: number) {
		return `${tabs(indent)}${this.formatName()}`;
	}

	emitQuoted(indent: number) {
		if (this.symbolData) {
			if (this.symbolData.symbolType === SymbolType.FunctionDeclaration) {
				return this.emit(indent)
			}
		}
		return `${tabs(indent)},${this.formatName()}`;
	}

	emitUnquoted(indent: number) {
		return `${tabs(indent)}\`${this.formatName()}`;
	}
}
