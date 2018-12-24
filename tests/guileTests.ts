import { TS, message, tslog, tsarray, getBufferCreate, insertBufferSubstringNoProperties, setBuffer, withCurrentBuffer, insert, doWithCurrentBuffer, pointMax } from 'emacs'

declare function message(msg: string): void

function main() {
	message("Foo bar")
}

//[form: ert-deftest]
function testSomething() {
	const foo = {
		hei: tsarray([1,2,3]),
		ok: {
			bar: {
				kult: () => {
					message("foobar it worked")
				}
			}
		}
	}
	foo.ok.bar.kult()
	return foo.hei.length() + ""
} 

main()
message(testSomething())
