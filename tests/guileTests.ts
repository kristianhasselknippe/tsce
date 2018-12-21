declare function message(msg: string): void
declare function should(item: boolean): boolean

function main() {
	message("Foo bar")
}

//[form: ert-deftest]
function testSomething() {
	should(1 + 2 == 4)
}

main()
testSomething()
