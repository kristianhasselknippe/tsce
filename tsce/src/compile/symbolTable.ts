class Declaration<T> {
	constructor(private readonly _symbol?: string, private readonly _data?: T) {}

	get symbol() {
		return this._symbol!
	}

	get data() {
		return this._data!
	}
}

interface Table<T> {
	[symbol: string]: Declaration<T>
}

class Scope<T> extends Declaration<T> {
	table: Table<T> = {}

	constructor(readonly parent?: SymbolTable<T>, symbol?: string, data?: T) {
		super(symbol, data)
	}

	insert(symbol: string, data: T) {
		const ret = new Declaration(symbol, data)
		this.table[symbol] = ret
		return ret
	}

	enterScope(symbol: string, data: T): Scope<T> {
		const ret = new Scope(this, symbol, data)
		this.table[symbol] = ret
		return ret
	}

	exitScope() {
		if (!this.parent) {
			throw new Error("Attempted to exit root scope")
		}
		return this.parent
	}

	lookup(symbol: string): T | undefined {
		if (symbol in this.table) {
			return this.table[symbol].data
		} else {
			if (this.parent) {
				this.parent.lookup(symbol)
			}
		}
	}
}

export class SymbolTable<T> extends Scope<T> {
	constructor() {
		super()
	}
}
