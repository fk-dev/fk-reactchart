import { trans } from './trans.tr.js';

const lang = (typeof window === 'undefined' ? null : window )?.reactchart?.lang ?? 'fr';

export function label(key){

	return trans[key]?.[lang] ?? key;
}
