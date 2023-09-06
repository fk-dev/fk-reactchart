import { rndKey } from './utils.js';

let storage = {};

const gradientVM = (colors,type,offs,id) => {
	const n = colors.length - 1;
	offs = offs || [];
	const offsets = colors.map( (c,i) => {
		return {
			color: c,
			off: offs[i] || `${100 * i/n}%`,
		};
	});

	return { offsets, id, type };
};

const notStored = (mid,cand) => {
	for(let id in storage[mid]){
		const { colors, type, offsets } = storage[mid][id];
		const _arrCheck = (_ref,__cand) => {
			const ref = _ref || [];
			const _cand = __cand || [];
			return ref.length === _cand.length && ref.reduce( (memo,v,i) => memo && v === _cand[i], true);
		};

		if(_arrCheck(colors,cand.colors) && _arrCheck(offsets,cand.offsets) && type === cand.type){
			return id;
		}
	}
};

export const newGradient = (opts, mid) => {
	const { colors, type, offsets } = opts;

	if(!storage[mid]){
		storage[mid] = {};
	}
	const check = notStored(mid,colors);
	if(check){
		return check;
	}
	const id = rndKey().replace(/\(/g,'a').replace(/\)/g,'b');
	storage[mid][id] = {
		colors,
		type, offsets,
		vm: gradientVM(colors,type,offsets,id)
	};
	return id;
};

export const remove = (mid,id) => {
	if(storage[mid] && storage[mid][id]){
		delete storage[mid][id];
	}
};

export const getGradientsPrinter = (mid) => {
	let gr = [];
	for(let id in storage[mid]){
		gr.push({id, vm: storage[mid][id].vm});
	}
	if(gr.length){
		return {
			print: (fct) => gr.map(({id, vm}) => fct(vm,id))
		};
	}
};

export const getAGradientVM = (mid,id) => {
	const s = storage[mid] ? storage[mid][id] : null;
	if(s){
		return s.vm;
	}
};

export const clear = (mid,only) => {

	if(storage[mid]){
		if(only){
			only.forEach(k => delete storage[mid][k]);
		}else{
			delete storage[mid];
		}
	}
};
