import * as s from "s"
import { should, equal } from 'ert'

export function testFromAnotherFileUsingTheEmacsApi() {
	const foo = "bar"
	const upped = s.sUpcase(foo)
	should(equal(upped, "BAR"))
	return true
}
