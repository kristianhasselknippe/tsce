import { jsonEncode, jsonReadFromString} from 'json'

export interface Logger {
	log: (msg: string) => void
}

export function initializePolyfills(logger: Logger) {
	return {
		console: {
			log: logger.log,
			error: logger.log
		},
		JSON: {
			stringify: jsonEncode,
			parse: jsonReadFromString
		}
	}
}
