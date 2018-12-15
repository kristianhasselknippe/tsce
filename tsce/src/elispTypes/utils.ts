export function tabs(indent: number) {
	let ret = '';
	for (let i = 0; i < indent * 4; i++) {
		ret += ' ';
	}
	return ret;
}
