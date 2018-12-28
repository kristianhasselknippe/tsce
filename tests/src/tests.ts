import * as emacs from 'emacs'

emacs.makeProcess({
	name: 'the name',
	command: ['git', 'status'],
	filter: (proc, msg) => {
		emacs.message(msg)
	},
	sentinel: (proc, msg) => {
		emacs.message(msg)
	}
})
