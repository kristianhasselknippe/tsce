interface Info {
	isReturnable?: boolean
}

interface DeclarationInfo<T> extends Info {
	data?: T
}

class Declaration<T> {
	constructor(private readonly _symbol?: string, private readonly _data?: DeclarationInfo<T>) {}

	get symbol() {
		return this._symbol!
	}

	get data() {
		return this._data
	}
}

interface Table<T> {
	[symbol: string]: Declaration<T>
}

class Scope<T> extends Declaration<T> {
	table: Table<T> = {}

	constructor(readonly parent?: SymbolTable<T>, symbol?: string, data?: T, info?: Info) {
		super(symbol, {
			data,
			...info
		})
	}

	get itemsInScope(): Declaration<T>[] {
		let ret = []
		for (const k in this.table) {
			ret.push(this.table[k])
		}
		if (this.parent) {
			ret = ret.concat(this.parent.itemsInScope)
		}
		return ret
	}

	insert(symbol: string, data: T) {
		const ret = new Declaration(symbol, data)
		this.table[symbol] = ret
		return ret
	}

	enterReturnableBlock() {
		const id = Math.floor(Math.random() * 100000)
		return this.enterScope("block-" + id)
	}

	enterScope(symbol: string, data?: T): Scope<T> {
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

	firstWhere(pred: (item: T) => boolean): Declaration<T> | undefined {
		for (const name in this.table) {
			const item = this.table[name]
			if (item.data && pred(item.data)) {
				return item
			}
		}
		if (this.parent) {
			return this.parent.firstWhere(pred)
		}
	}

	print() {
		console.log("Printing of symbol table not yet implemented")
	}
}

export class SymbolTable<T> extends Scope<T> {
	constructor() {
		super()
	}
}
