import chalk from 'chalk'

interface Table<T> {
	[symbol: string]: T
}

export class SymbolTable<T> {
	symbols: Table<T> = {}

	constructor(private _parent?: SymbolTable<T>) { }

	get hasParent() {
		return typeof this._parent !== 'undefined'
	}

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

	tryLookup(symbol: string): T | undefined {
		if (symbol in this.symbols) {
			return this.symbols[symbol]
		} else {
			if (this.hasParent) {
				return this.parent.tryLookup(symbol)
			}
		}
	}

	lookup(symbol: string): T {
		const ret = this.tryLookup(symbol)
		if (typeof ret === 'undefined') {
			throw new Error("Unable to find name in symbol table: " + symbol)
		}
		return ret
	}

	updateSymbolDataInline(name: string, updater: (oldData: T) => void) {
		updater(this.lookup(name)!)
	}

	visualize() {
		console.log(chalk.blueBright("Scope: "))
		for (const k in this.symbols) {
			const item = this.symbols[k]
			console.log(chalk.greenBright(`   ${k} -> ${item}`))
		}
		console.log(chalk.redBright("|"))
		console.log(chalk.redBright("V"))
		if (this.hasParent) {
			this.parent.visualize()
		}
	}
}
