interface Table<T> {
	[symbol: string]: T
}

export class SymbolTable<T> {
	symbols: Table<T> = {}

	constructor(private _parent?: SymbolTable<T>) { }

	get parent() {
		if (!this._parent) {
			throw new Error("Tried to get parent of root table")
		}
		return this._parent!
	}

	insert(symbol: string, data: T): T {
		this.symbols[symbol] = data
		return data
	}

	enterScope(): SymbolTable<T> {
		return new SymbolTable(this)
	}

	exitScope() {
		if (!this.parent) {
			throw new Error("Attempted to exit root scope")
		}
		return this.parent
	}

	lookup(symbol: string): T {
		if (symbol in this.symbols) {
			return this.symbols[symbol]
		} else {
			if (this.parent) {
				this.parent.lookup(symbol)
			}
		}
		throw new Error("Unable to find name in symbol table: " + symbol)
	}
}
