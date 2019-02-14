import * as emacs from "emacs"
import { should, equal } from 'ert'

export function testFromAnotherFileUsingTheEmacsApi() {
	const foo = "bar"
	const l = emacs.length(foo)
	let test: number | string = 123
	testEverything()
	test = 321
	test = "heisann"
	should(equal(l, 3))
	return true
}

export function testEverything() {
	let foo = 10
	let bar = 20
	const test = bar + foo
	const test2 = "foo"
	if (test > 29) {
		bar = 123
	} else {
		foo = 321
	}

	return test
}
