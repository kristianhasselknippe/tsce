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

	private findFirstOrThrow<T extends Node>(pred: (item: Node) => item is T, error: Error): T {
		for (let i = this.stack.length - 1; i >= 0; i--) {
			let item = this.stack[i]
			if (pred(item)) {
				return item
			}
		}
		throw error
	}

	getCurrentScope(): Scope {
		return this.findFirstOrThrow(this.isScope, new Error("There was no scope in the stack"))
	}

	getCurrentBlock(): Block {
		return this.findFirstOrThrow(this.isBlock, new Error("There was no block in the stack, did you try to return from outside a function?"))
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

	printStack() {
		this.visualizeStack(this.stack)
	}

	getItemsInScope(scope: Scope) {
		const index = this.stack.indexOf(scope)
		return this.stack.slice(index+1)
	}

	popStackToScope(scope: Scope) {
		this.stack = this.stack.slice(0, this.stack.indexOf(scope) + 1)
	}

	resolveToCurrentScope() {
		const currentScope = this.getCurrentScope()
		const itemsInScope = this.getItemsInScope(currentScope)
		for (const item of itemsInScope) {
			currentScope.body.push(item)
		}
		this.popStackToScope(currentScope)
	}

	resolveTo(scope: Scope) {
		console.log("Resolving to: " + scope.type)

		while (this.peek() !== scope) {
			this.resolveToCurrentScope()
			if (this.getCurrentScope() !== scope) {
				const item = this.stack.pop()!
				this.getCurrentScope().body.push(item)
				this.resolveTo(scope)
			}
		}

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
