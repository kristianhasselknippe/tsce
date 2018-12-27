import * as emacs from 'emacs'
import * as s from 's'

const foo = 'HeiSann'
const rest = s.sUpcase(foo)

emacs.message('We were able to upcase ' + rest)

const process = emacs.makeProcess({
	commant: ['foo', 'bar'],
	name: 'This is the name'
})
