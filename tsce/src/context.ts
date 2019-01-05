import Stack from './stack';
import { tabs, Node, Expression } from './elispTypes';
import { SourceFile, Node as SimpleNode } from 'ts-simple-ast';
import { SymbolTable, SymbolType } from './symbolTable';

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

	pushSymbol(node: SimpleNode, sym: SymbolType) {
		this.symTable.push(node, sym);
	}

	getSymbolForNode(node: SimpleNode) {
		return this.symTable.getSymbolForNode(node)
	}

	getCommentsForNode(node: SimpleNode, debug = false) {
		const ret = [];
		const sourceFile = node.getSourceFile()
		const comments = node.getLeadingCommentRanges()
		if (comments) {
			for (const comment of comments) {
				const commentText = sourceFile
					.getText()
					.substring(comment.getPos(), comment.getEnd());
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

	printAtStackOffset(text: string, node?: SimpleNode) {
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
