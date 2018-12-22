
enum CompilerDirectiveType {
	Name,
	Predicate,
	NamedArguments
}

export class CompilerDirective {
	static ParseComment(comment: string) {
		//'\s*([^\[\]\s]+)\s*([^\[\]]+)?\s*'
		const regex = new RegExp('\[([^\]]*)\]', 'g')
		const matches = comment.match(regex)
		if (matches && matches.length > 0) {
			
		}
	}
}
