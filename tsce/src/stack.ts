import { Expression, Node, Scope, Block, tabs } from "./elispTypes";

export default class Stack {
	private stack: Node[] = [];

	peek() {
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

	private findFirstOrThrow<T extends Node>(stack: Node[], pred: (item: Node) => item is T, error: Error): T {
		for (let i = stack.length - 1; i >= 0; i--) {
			let item = stack[i]
			if (pred(item)) {
				return item
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

	addStatementToCurrentScope(exp: Expression) {
		const currentScope = this.getCurrentScope()
		let scopeToAddTo = currentScope
		if (currentScope === exp) {
			console.log("Addin to parent scope instead: ", this.parentScopeOf(currentScope))
			scopeToAddTo = this.parentScopeOf(currentScope)
		}
		scopeToAddTo.body.push(exp)
	}

	getElispSource() {
		return this.peek()!.emit(0);
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

	push<T extends Expression>(expr: T): T {
		this.stack.push(expr)
		return expr
	}

	pop() {
		return this.stack.pop()!
	}

	popTo(expr: Expression) {
		let ret = []
		while (this.peek() !== expr) {
			ret.push(this.pop())
		}
		return ret
	}
}
