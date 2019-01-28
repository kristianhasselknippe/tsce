interface Table<T> {
	[symbol: string]: T
}

type BodySetter<T> = (body: T) => void

class SymbolTable<T> {
	symbols: Table<T> = {}

	constructor(readonly parent?: SymbolTable<T>) { }

	insert(symbol: string, data: T) {
		this.symbols[symbol] = data
	}

	enterScope(symbol: string, data: T => void): SymbolTable<T> {
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
