import { rndKey } from './utils.js';

let storage = {};

const gradientVM = (colors,id) => {
	const n = colors.length - 1;
	const offsets = colors.map( (c,i) => {
		return {
			color: c,
			off: `${100 * i/n}%`
		};
	});

	return { offsets, id };
};

const notStored = cand => {
	for(let id in storage){
		const { colors } = storage[id];
		if(colors.length === cand.length && colors.reduce( (memo,v,i) => memo && v === cand[i], true)){
			return id;
		}
	}
};

export const newGradient = (colors) => {
	const check = notStored(colors);
	if(check){
		return check;
	}
	const id = rndKey();
	storage[id] = {
		colors,
		vm: gradientVM(colors,id)
	};
	return id;
};

export const remove = id => {
	delete storage[id];
};

export const getGradientsPrinter = () => {
	let gr = [];
	for(let id in storage){
		gr.push({id, vm: storage[id].vm});
	}
	if(gr.length){
		return {
			print: (fct) => gr.map(({id, vm}) => fct(vm,id))
		};
	}
};

export const getAGradientVM = id => {
	const s = storage[id];
	if(s){
		return s.vm;
	}
};
