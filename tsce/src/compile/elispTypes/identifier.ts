import { Expression, tabs, hyphenate } from '.';
import { NodeData, SymbolType } from '../parser';
import { CompilerDirective } from './compilerDirective';

export class Identifier extends Expression {
	type: string = 'Identifier';

	isPredicate = false;
	customName?: string;
	useNamedArguments = false;

	constructor(
		readonly identifierName: string,
		readonly compilerDirectives: CompilerDirective[],
		readonly symbolData?: NodeData
	) {
		super();

		if (this.compilerDirectives) {
			for (const compDir of this.compilerDirectives) {
				switch (compDir.kind) {
					case 'Name':
						this.customName = compDir.name;
						break;
					case 'Predicate':
						this.isPredicate = true;
						break;
					case 'NamedArguments':
						this.useNamedArguments = true;
						break;
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
				return this.emit(indent);
			}
		}
		return `${tabs(indent)},${this.formatName()}`;
	}

	emitUnquoted(indent: number) {
		return `${tabs(indent)}\`${this.formatName()}`;
	}
}
