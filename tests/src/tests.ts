import { should, equal } from 'ert'
import * as emacs from 'emacs'

//[Form: ert-deftest]
function testEquality(){
	should(equal('a', 'a'))
}

//[Form: ert-deftest]
function testStringConcat(){
	const a = 'a'
	const b = 'b'
	const ab = a + b
	should(equal(ab, 'ab'))
}

//[Form: ert-deftest]
function testObjectCreation(){
	const obj = {
		a: 'aaa',
		b: 'bbb'
	}
	should(equal(obj.a, 'aaa'))
	should(equal(obj.b, 'bbb'))
}

//[Form: ert-deftest]
function testArrayCreation(){
	const arr = [1,2,3,4,5]
	should(equal(arr[0], 1))
	should(equal(arr[1], 2))
	should(equal(arr[2], 3))
	should(equal(arr[3], 4))
	should(equal(arr[4], 5))
}
