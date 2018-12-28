export type CompilerDirectiveKind = 'Name' | 'Form' | 'Predicate' | 'NamedArguments'

interface CompilerDirectiveBase {
	kind: CompilerDirectiveKind
}

export interface Name extends CompilerDirectiveBase {
	kind: 'Name'
	name: string
}

export interface Form extends CompilerDirectiveBase {
	kind: 'Form'
	form: string
}

export interface Predicate extends CompilerDirectiveBase {
	kind: 'Predicate'
}

export interface NamedArguments extends CompilerDirectiveBase {
	kind: 'NamedArguments'
}

export type CompilerDirective = Name | Predicate | NamedArguments | Form

function expectNumArgs(directive: string, args: string[], num: number) {
	if (args.length !== num) {
		throw new Error(`Expected directive ${directive} to have ${num} args, but had ${args.length} (${args.reduce((prev, curr) => prev + curr + ", ")})`)
	} else {
		return true
	}
}

// TODO: Use regex or something instead of this nonsense
function parseBody(body: string): CompilerDirective {
	const [directive, bodyArgs] = body.split(':')

	let args: string[] = []
	if (bodyArgs) {
		args = bodyArgs.split(' ').filter(x => x.length > 0).map(x => x.trim())
	}

	switch (directive) {
		case "Name":
			if (expectNumArgs(directive, args, 1)) {
				return {
					kind: 'Name',
					name: args[0]
				}
			}
		case "Form":
			if (expectNumArgs(directive, args, 1)) {
				return {
					kind: 'Form',
					form: args[0]
				}
			}
		case "Predicate":
			return {
				kind: 'Predicate'
			}
		case "NamedArguments":
			return {
				kind: 'NamedArguments'
			}
		default:
			throw new Error(`Error parsing directive body, didn't recognize diretive type: ${body}`)
	}
}

export function extractCompilerDirectivesFromString(comment: string): CompilerDirective[] {
	const directiveRegex = new RegExp('\\[([^\\[\\]]*)\\]', 'g')
	const matches = comment.match(directiveRegex)
	let ret = []
	if (matches && matches.length > 0) {
		for (const directive of matches) {
			const directiveBody = directive.substring(1, directive.length-1)

			const parsed = parseBody(directiveBody)
			if (typeof parsed != "undefined") {
				ret.push(parsed)
			}
		}
	}
	//console.log(`   |- Compiler directive: (len: ${ret.length})`, ret)
	return ret
}


export function extractCompilerDirectivesFromStrings(comments: string[]): CompilerDirective[] {
	let ret: CompilerDirective[] = []
	for (const c of comments) {
		ret = ret.concat(extractCompilerDirectivesFromString(c))
	}
	return ret
}
