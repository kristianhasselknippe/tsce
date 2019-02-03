import { Stack } from '../compiler'

test("Stack push and pop", () => {
	const stack = new Stack<string>()
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
