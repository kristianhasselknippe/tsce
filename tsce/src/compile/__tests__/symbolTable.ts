import * as sym from "../symbolTable"

test("Basic symbol table behavior", () => {
	const table = new sym.SymbolTable<any>()
	table.insert("foobar", "testing")
	const ret = table.lookup("foobar")
	expect(ret).toBe("testing")
})
