import { deepCp } from './utils.js';
import Freezer from 'freezer-js';

const deepEqual = function(obj1,obj2){
	if(typeof obj1 === 'object'){
		if(!obj2 || typeof obj2 !== 'object'){
			return false;
		}
		if(obj1 instanceof Date){
			return obj2 instanceof Date ? obj1.getTime() === obj2.getTime() : false;
		}else{
			for(let t in obj1){
				if(!deepEqual(obj1[t],obj2[t])){
					return false;
				}
			}
			for(let u in obj2){
				if(obj1[u] === null ||	obj1[u] === undefined){
					return false;
				}
			}
		}
	}else{
		return obj1 === obj2;
	}
	return true;
};

const noFreeze = function(obj){
	return {
		object: obj,
		get: () => {obj = deepCp({},obj); return obj;}
	};
};


export function mergeDeep(src,tgt){
	return deepCp(tgt,src);
}

export function isImm(obj){
	return typeof obj  !== 'object' ||  Object.isFrozen(obj);
}

export function immutable(obj){
	return isImm(obj) ? obj : ( new Freezer(obj, { singleParent: true}) ).get();
}

export function freeze(obj,type){
	return type === 'no' ? noFreeze(obj) : new Freezer(obj, { singleParent: true});
}

export function isEqual(obj1,obj2){

	let immut1 = isImm(obj1);
	let immut2 = isImm(obj2);
	return immut1 === immut2 ? immut1 ? obj1 === obj2 : deepEqual(obj1,obj2) : false;
}
