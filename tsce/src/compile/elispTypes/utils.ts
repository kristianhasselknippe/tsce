export function tabs(indent: number) {
	let ret = '';
	for (let i = 0; i < indent * 4; i++) {
		ret += ' ';
	}
	return ret;
}

export function isUpper(character: string) {
	return (character !== character.toLowerCase())
		&& (character === character.toUpperCase());
}

export function hyphenate(name: string) {
	let ret = ""
	for (const char of name) {
		if (isUpper(char)) {
			ret += "-" + char.toLowerCase()
		} else {
			ret += char
		}
	}
	return ret
}

export function generateTempBindingName() {
	return 'temp' + Math.floor(Math.random() * 100000)
}
