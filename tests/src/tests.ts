import { should, equal } from 'ert'
import * as emacs from 'emacs'

//[Form: ert-deftest]
function test1(){
	should(equal('a', 'a'))
}

//[Form: ert-deftest]
function test2(){
	const a = 'a'
	const b = 'b'
	const ab = a + b
	should(equal(ab, 'ab'))
}
