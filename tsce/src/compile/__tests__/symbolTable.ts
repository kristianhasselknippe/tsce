import * as sym from "../symbolTable"

test("Basic symbol table lookup", () => {
	const table = new sym.SymbolTable<any>()
	table.insert("foobar", "testing")
	const ret = table.lookup("foobar")
	expect(ret).toBe("testing")
})

test("Basic symbol table scoped lookup", () => {
	const table = new sym.SymbolTable<any>()
	table.insert("foobar", "testing")
	const scope = table.enterScope("scope1", "scope1")
	scope.insert("kult", "kult")

	const ret = table.lookup("foobar")
	expect(ret).toBe("testing")

	const kult = table.lookup("kult")
	expect(kult).toBe(undefined)

	const kultActual = scope.lookup("kult")
	expect(kultActual).toBe("kult")
})
