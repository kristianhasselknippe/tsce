import Stack from './stack';
import { tabs, Node, Expression, Scope, Block, Identifier, RootScope } from './elispTypes';
import { SourceFile, Node as SimpleNode } from 'ts-simple-ast';
import { DeclarationsSource } from './elispTypes/declaration';

export class Marker extends Node {
	type = 'Marker';

	emit(indent: number): string {
		throw new Error("Internal error: There should be no markers left on the stack after compilation.");
	}
}

interface DeclarationList {
	daclaratoins: Identifier
}

export class Context {
	private stack: Node[] = [];

	private peek() {
		if (this.stack.length > 0) {
			return this.stack[this.stack.length - 1];
		} else {
			throw new Error("Tried to peek into an empty stack")
		}
	}

	get size() {
		return this.stack.length;
	}

	private isScope(expr: Node): expr is Scope {
		return expr.isScope()
	}

	private isBlock(expr: Node): expr is Block {
		return expr.isBlock()
	}

	private findFirst<T extends Node>(stack: Node[], pred: (item: Node) => boolean): T | undefined {
		for (let i = stack.length - 1; i >= 0; i--) {
			let item = stack[i]
			if (pred(item)) {
				return item as T
			}
		}
	}

	private findFirstOrThrow<T extends Node>(stack: Node[], pred: (item: Node) => boolean, error: Error): T {
		for (let i = stack.length - 1; i >= 0; i--) {
			let item = stack[i]
			if (pred(item)) {
				return item as T
			}
		}
		throw error
	}

	getCurrentScopeFor(stack: Node[]): Scope {
		return this.findFirstOrThrow(stack, this.isScope, new Error("There was no scope in the stack"))
	}

	getCurrentScope(): Scope {
		return this.getCurrentScopeFor(this.stack)
	}

	getCurrentBlock(): Block {
		return this.findFirstOrThrow(this.stack, this.isBlock, new Error("There was no block in the stack, did you try to return from outside a function?"))
	}

	parentScopeOf(scope: Scope) {
		let index = this.stack.indexOf(scope)
		for (let i = index - 1; i >= 0; i--) {
			if (this.stack[i].isScope()) {
				return this.stack[i] as Scope
			}
		}
		throw new Error("Scope had no parent scope: " + JSON.stringify(scope))
	}

	getDeclarationOfIdentifier(identifierName: string) {
		const scopes = this.stack.filter(x => x.isScope() || x.isDeclarationsSource()) as (Node & (Scope | DeclarationsSource))[]
		for (const node of scopes.reverse()) {
			if (node.isScope()) {
				const decl = node.getDeclarationOfIdentifier(identifierName)
				if (decl) {
					return decl
				}
			} else {
				const decls = node.getDeclarations()
				for (const decl of decls) {
					if (decl.matchesIdentifier(identifierName)) {
						return decl
					}
				}
			}
		}
	}

	addStatementToCurrentScope(exp: Expression) {
		const currentScope = this.getCurrentScope()
		let scopeToAddTo = currentScope
		if (currentScope === exp) {
			console.log("Addin to parent scope instead: ", this.parentScopeOf(currentScope))
			scopeToAddTo = this.parentScopeOf(currentScope)
		}
		scopeToAddTo.body.push(exp)
	}

	visualizeItem(item: Node, indent: number) {
		let spaces = ""
		for (let i = 0; i < indent; i++) {
			spaces += " "
		}
		console.log("  " + spaces + "|- " + item.type)
		if (item.isScope()) {
			for (const i of item.body) {
				this.visualizeItem(i, indent + 1)
			}
		}
	}

	visualizeStack(stack: Node[]) {
		console.log("Stack:")
		for (const item of stack) {
			console.log("  " + item.type + " (block: " + item.isScope() + ")")
			if (item.isScope()) {
				for (const child of item.body) {
					this.visualizeItem(child, 1)
				}
			}
		}
	}

	isInRootScope() {
		return this.getCurrentScope().isRootScope()
	}

	printStack() {
		if (this.stack.length == 0) {
			return
		}
		console.log((this.stack[0] as RootScope).sourceFile.getBaseName())
		this.visualizeStack(this.stack)
	}

	getItemsInScope(scope: Scope) {
		//We prob have a bug here because it might return true for two different items
		const index = this.stack.indexOf(scope)
		return this.stack.slice(index+1)
	}

	popStackToScope(scope: Scope) {
		this.stack = this.stack.slice(0, this.stack.indexOf(scope) + 1)
	}

	resolveToScope(scope: Scope) {
		const itemsInScope = this.getItemsInScope(scope)
		for (const item of itemsInScope) {
			scope.body.push(item)
		}
		this.popStackToScope(scope)
	}

	resolveToCurrentScope() {
		const currentScope = this.getCurrentScope()
		return this.resolveToScope(currentScope)
	}

	resolveTo(scope: Scope) {
		let currentScope = this.getCurrentScope()
		while (this.peek() !== scope) {
			this.resolveToScope(currentScope)
			if (this.getCurrentScope() !== scope) {
				currentScope = this.parentScopeOf(currentScope)
			}
		}
	}

	getParentScopeOf(scope: Scope) {
		const scopeIndex = this.stack.indexOf(scope)
		const parentStack = this.stack.slice(0, scopeIndex)
		return this.getCurrentScopeFor(parentStack)
	}

	resolveToParentOf(scope: Scope) {
		const parent = this.getParentScopeOf(scope)
		this.resolveTo(parent)
	}

	push<T extends Node>(expr: T): T {
		this.stack.push(expr)
		return expr
	}

	pop() {
		return this.stack.pop()!
	}

	popTo(expr: Node) {
		let ret = []
		while (this.peek() !== expr) {
			ret.push(this.pop())
		}
		return ret
	}

	getElispSource() {
		//this.printStack()
		return this.peek()!.emit(0);
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
