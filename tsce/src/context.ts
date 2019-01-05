import Stack from './stack';
import { tabs, Node, Expression } from './elispTypes';
import { ts, SourceFile } from 'ts-simple-ast';

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

export class Marker extends Expression {
    type = 'Marker';

    emit(indent: number): string {
        throw new Error("Internal error: There should be no markers left on the stack after compilation.");
    }
}

export class Context extends Stack {
	private symTable = new SymbolTable();
	private sourceTexts: { [index: string]: string } = {};

	constructor(
		readonly sourceFiles: ReadonlyArray<SourceFile>
	) {
		super();
		sourceFiles.forEach(x => (this.sourceTexts[x.getFilePath()] = x.getText()));
	}

	pushMarker() {
		const marker = new Marker()
		this.push(marker)
		return marker
	}

	popToMarker<T extends Node>(marker: Marker): T[] {
		const ret = this.popTo(marker) as T[]
		this.pop(); //pop marker
		return ret
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
		const sourceFile = node.getSourceFile()
		const start = node.getFullStart();
		const comments = ts.getLeadingCommentRanges(
			sourceFile.getText(),
			start
		);

		if (comments) {
			for (const comment of comments) {
				const commentText = sourceFile
					.getText()
					.substring(comment.pos, comment.end);
				ret.push(commentText);
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
		/*let scope = '<no scope>';
		try {
			scope = this.getCurrentScope().type;
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
				this.size
		);*/
	}
}
