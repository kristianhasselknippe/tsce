import * as sym from "../symbolTable"
import { throws } from "assert";

test("Basic symbol table lookup", () => {
	const table = new sym.SymbolTable<any>()
	table.insert("foobar", "testing")
	const ret = table.lookup("foobar")
	expect(ret).toBe("testing")
})

test("Basic symbol table scoped lookup", () => {
	const table = new sym.SymbolTable<any>()
	table.insert("foobar", "testing")
	const scope = table.enterScope()
	scope.insert("kult", "kult")

	const ret = table.lookup("foobar")
	expect(ret).toBe("testing")

	expect(() => table.lookup("kult")).toThrow()

	const kultActual = scope.lookup("kult")
	expect(kultActual).toBe("kult")
})
