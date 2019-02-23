import { Expression, tabs, hyphenate } from '.';
import { NodeData, SymbolType } from '../parser';
import path from 'path'

export class Identifier extends Expression {
	type: string = 'Identifier';

	isPredicate = false;
	customName?: string;
	useNamedArguments = false;

	constructor(
		readonly identifierName: string,
		readonly symbolData?: NodeData
	) {
		super();

		if (this.symbolData) {
			for (const compDir of this.symbolData.compilerDirectives) {
				console.log("Comp dir of actual: " + compDir.kind)
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

			for (const compDir of this.symbolData.compilerDirectivesDeclaration) {
				console.log("Comp dir of declaration: " + compDir.kind)
				switch (compDir.kind) {
					case 'NamedArguments':
						this.useNamedArguments = true;
						break;
				}
			}
		}
	}

	get namespacePrefix() {
		if (this.symbolData && this.symbolData.isRootLevelDeclaration && this.symbolData.hasImplementation) {
			return path.parse(this.symbolData.fileName).name + '/'
		}
		return ''
	}

	formatName() {
		if (this.customName) {
			continu here: we need to make sure that we do not use the custom name if the
			identifier in question is actually a new field (like
															{ foo: bar }
															if bar has a custom name,
															then foo should not take that name!
			return `${this.customName}`
		} else {
			let ret = `${this.namespacePrefix}${hyphenate(this.identifierName)}`
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
