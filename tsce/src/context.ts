import Stack from './stack';
import { tabs } from './elispTypes';
import * as ts from 'typescript';

export enum SymbolType {
	Function,
	Variable,
	Lambda
}

export interface Symbol {
	name: string;
	type: SymbolType;
}

export class SymbolTable {
	private symbols: Symbol[] = [];

	push(symbol: Symbol) {
		this.symbols.push(symbol);
	}

	searchBackwards(pred: (symbol: Symbol) => boolean) {
		for (let i = this.symbols.length - 1; i >= 0; i--) {
			const sym = this.symbols[i];
			if (pred(sym)) {
				return sym;
			}
		}
		return {
			name: '<missing>',
			type: SymbolType.Function
		};
	}
}

export class Context extends Stack {
	private symTable = new SymbolTable();
	private sourceTexts: { [index: string]: string } = {};

	constructor(
		readonly sourceFiles: ReadonlyArray<ts.SourceFile>,
		readonly typeChecker: ts.TypeChecker
	) {
		super();
		sourceFiles.forEach(x => (this.sourceTexts[x.fileName] = x.getText()));
	}

	addSymbol(sym: Symbol) {
		this.symTable.push(sym);
	}

	getSymbolForName(name: string) {
		return this.symTable.searchBackwards(sym => {
			return sym.name === name;
		});
	}

	getCommentsForNode(node: ts.Node, debug = false) {
		const ret = [];
		for (const sourceFile of this.sourceFiles) {
			const theSource = node.getSourceFile();
			const start = node.getFullStart();
			const comments = ts.getLeadingCommentRanges(
				theSource.getText(),
				start
			);
			if (comments) {
				for (const comment of comments) {
					const commentText = this.sourceTexts[
						sourceFile.fileName
					].substring(comment.pos, comment.end);
					ret.push(commentText);
				}
			}
		}
		return ret;
	}

	private stackCount = 0;

	incStackCount() {
		this.stackCount++;
	}

	decStackCount() {
		this.stackCount--;
	}

	getCallStackSize() {
		return this.stackCount;
	}

	stackSizeTabs() {
		const stackSize = this.getCallStackSize();
		return tabs(stackSize);
	}

	printAtStackOffset(text: string, node?: ts.Node) {
		/*	let scope = '<no scope>';
		try {
			scope = this.stack.getCurrentScope().type;
		} catch (e) {
			console.log('Error : ' + e);
		}
		console.log(
			this.stackSizeTabs() +
				text +
				' - ' +
				(node ? node.getText() : '') +
				' scope: ' +
				scope +
				', size: ' +
				this.stack.size
		);*/
	}
}
