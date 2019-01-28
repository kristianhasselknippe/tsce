import { tabs, Node, Expression, Scope, Block, RootScope } from './elispTypes';
import { Node as SimpleNode } from 'ts-simple-ast';
import { DeclarationsSource } from './elispTypes/declaration';
import { SymbolTable } from './symbolTable';

export class Marker extends Node {
	type = 'Marker';

	emit(indent: number): string {
		throw new Error("Internal error: There should be no markers left on the stack after compilation.");
	}
}

export class Context {
	private symTable: SymbolTable<Node> = new SymbolTable();

	private findFirstOrThrow<T extends Node>(pred: (item: Node) => boolean, error: Error): T {
		const ret = this.symTable.firstWhere(pred)
		if (ret) {
			return ret.data as T
		}
		throw error
	}

	getCurrentScopeFor(stack: Node[]): Scope {
		return this.findFirstOrThrow(item => item.isScope(), new Error("There was no scope in the stack"))
	}

	getCurrentScope(): Scope {
		return this.symTable.data as Scope
	}

	getCurrentBlockId(): Block {
		return this.findFirstOrThrow(item => item.isBlock(), new Error("There was no block in the stack, did you try to return from outside a function?"))
	}

	parentScopeOf(scope: Scope) {
		if (this.symTable.parent) {
			return this.symTable.parent.data as Scope
		}
		throw new Error("Scope had no parent scope: " + JSON.stringify(scope))
	}

	getDeclarationOfIdentifier(identifierName: string) {
		return this.symTable.lookup(identifierName)
	}

	enterReturnableBlock() {
		this.symTable.enterReturnableBlock()
	}

	getCurrentReturnableBlock() {
		
	}

	isInRootScope() {
		return (typeof this.symTable.parent === 'undefined')
	}

	printStack() {
		this.symTable.print()
	}

	resolveToScope(scope: Scope) {
		//unsure what to do here now
	}

	resolveToCurrentScope() {
		//unsure
	}

	resolveTo(scope: Scope) {
		//unsure
	}

	resolveToParentOf(scope: Scope) {
		//unsure
	}

	tempStack: Node[] = []

	peek() {
		return this.tempStack[this.tempStack.length - 1]
	}

	getElispSource() {
		//this.printStack()
		return this.peek()!.emit(0);
	}

	getCommentsForNode(node: SimpleNode) {
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
