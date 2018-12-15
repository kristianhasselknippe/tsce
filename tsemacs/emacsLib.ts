import { intern, require as emacsRequire } from 'emacs'

export namespace EmacsLib {
	export function require(symbolName: string) {
        return emacsRequire(intern(symbolName))
	}
}
