import { interactive } from 'emacs'
import * as s from 's'
import * as json from 'json'


function main() {
	var foo = {
		hei: 'hvordan',
		har: 'du',
		det: 'det?',
		ok: [1,2,3,4,5]
	}

	const ret = json.jsonEncode(foo)
	emacs.message('Json string: ' + ret)

	const parsed = json.jsonReadFromString<typeof foo>(ret)
	emacs.message('Parsed hei: ' + parsed.hei)
	emacs.message('Parsed det: ' + parsed.det)

}
main()
