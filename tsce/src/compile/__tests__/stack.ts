import { Stack } from '../compiler'

function createEmptyScope() {
	return {
		add: () => {}
	} as any
}

test("Stack push and pop", () => {
	const stack = new Stack<string>()
	stack.pushScope(createEmptyScope())
	stack.push("one")
	expect(stack.peek()).toBe("one")
	stack.push("two")
	expect(stack.peek()).toBe("two")
	stack.push("three")
	expect(stack.peek()).toBe("three")

	expect(stack.pop()).toBe("three")
	expect(stack.pop()).toBe("two")
	expect(stack.pop()).toBe("one")
})

test("Test pushing scope on stack", () => {
	const stack = new Stack<any>()
	stack.pushScope(createEmptyScope())
	stack.push("one")
	const scope = stack.pushScope({
		add: (item: string) => {
			expect(item).toBe("two")
		}
	})
	stack.push("two")
	stack.resolveTo(scope)
})
