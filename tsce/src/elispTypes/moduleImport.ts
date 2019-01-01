import { Statement, tabs, StringLiteral, Identifier } from '.';
import { SymbolType } from '../context';

export class ModuleImport extends Statement {
	type: string = 'ModuleImport';

	constructor(
		readonly moduleString: StringLiteral,
		readonly isRelativePath: boolean
	) {
		super();
	}

	emit(indent: number) {
		if (this.isRelativePath) {
			return `${tabs(indent)}(load-file ${this.moduleString.emitWith(
				0,
				'.el'
			)})\n`;
		} else {
			/* TODO: We don't emit modules outside our own project.
			   This might not be enough in the future. */
			return '';
		}
	}
}

export class NamespaceImport extends ModuleImport {
	constructor(
		readonly namespaceObjectIdentifier: Identifier,
		readonly namespaceMembers: Identifier[],
		moduleString: StringLiteral,
		isRelativePath: boolean
	) {
		super(moduleString, isRelativePath);
	}

	emitMembers(indent: number) {
		let ret = ''
		for (const member of this.namespaceMembers) {
			let quotation = ""
			if (member.symbol.type === SymbolType.Variable) {
				quotation = ","
			}
			ret += `${tabs(indent)}(${member.emit(0)} . ${quotation}${member.emit(0)})\n`
		}
		return ret
	}

	emitNamespaceObject(indent: number) {
		return `${tabs(indent)}(setq ${this.namespaceObjectIdentifier.emit(0)} \`(\n${this.emitMembers(indent + 1)}))`
	}

	emit(indent: number) {
		const loadingTheModule = super.emit(indent) + '\n'
		const namespaceObject = this.emitNamespaceObject(indent)
		return loadingTheModule + namespaceObject
	}
}
