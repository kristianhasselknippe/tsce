import * as emacs from "emacs"
import { should, equal } from 'ert'

export function testFromAnotherFileUsingTheEmacsApi() {
	const foo = "bar"
	const l = emacs.length(foo)
	let test: number | string = 123
	test = 321
	test = "heisann"
	should(equal(l, 3))
	return true
}
