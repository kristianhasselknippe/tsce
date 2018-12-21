import { intern, require as req } from 'emacs'


//[elispName: require]
export function emacsRequire(symbolName: string) {
	return req(intern(symbolName))
}
