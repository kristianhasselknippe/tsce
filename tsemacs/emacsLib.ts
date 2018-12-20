import { intern, require } from 'emacs'

export function emacsRequire(symbolName: string) { 
	return require(intern(symbolName))
}
