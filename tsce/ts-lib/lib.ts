import { intern, require as req } from 'emacs'


//[Name: require]
export function emacsRequire(symbolName: string) {
	return req(intern(symbolName))
}
