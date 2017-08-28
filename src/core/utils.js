import * as date from './dateMgr.js';
import * as nbr from './nbrMgr.js';

let isPeriod = function(v){
	let out = false;
	for(let t in {years: true, 	months: true, weeks: true, days: true}){
		out = out || !isNil(v[t]);
	}
	return out;
};

export { misc as math } from './mathMgr.js';

export function isDate(v){ return !!v && (v instanceof Date || isPeriod(v));}

export function isArray(v){ return !!v && Array.isArray(v);}

export function isString(v){ return !!v && typeof v === 'string';}

export function isNil(v){ return v === null || v === undefined;}

export function isValidNumber(r){ return !isNil(r) && !isNaN(r) && isFinite(r);}

export function isValidParam(p){ return isDate(p) || isString(p) || isValidNumber(p);}

export function deepCp(tgt,thing){

	if(isNil(thing)){
		return tgt;
	}

	if(typeof thing === 'object'){
		if(!tgt || typeof tgt !== 'object'){
			if(isArray(thing)){
				tgt = [];
			}else if(thing instanceof Date){
				tgt = new Date(thing.getTime());
			}else if(thing === null){
				return null;
			}else{
				tgt = {};
			}
		}
		for(let t in thing){
			tgt[t] = deepCp(tgt[t],thing[t]);
		}
	}else{
		tgt = thing;
	}
	return tgt;
}

export function mgr(ex){ return isDate(ex) ? date : nbr;}

export function homothe(src,tgt,fac,val){
	let t = isDate(tgt) ? date.getValue(tgt) : tgt;
	let v = isDate(val) ? date.getValue(val) : val;
	let s = isDate(src) ? date.getValue(src) : src;
	let sol = t + (v - s) * fac;
  return ( isDate(tgt) ) ? new Date(sol) : sol ;
}

export function toValue(val){ return isDate(val) ? date.getValue(val) : val;}

export function direction(line, ds){
		// line is AC
		//
		//             C
		//            /|
		//          /  |
		//        /    |
		//      /      |
		//    /        |
		//	A -------- B
		//

		let distSqr = (p1,p2) => (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
		let B = {x: line.end.x, y: line.start.y};
		let AB = distSqr(line.start,B);
		let BC = distSqr(B,line.end);

		let hor = '-1';
		let ver = '-1';
		if(ds){
			// 0: left, 1: right
			hor = Math.abs(line.end.x - ds.x.c.min) < Math.abs(ds.x.c.max - line.end.x) ? '0' : '1';
			// 0: bottom, 1: top
			ver = Math.abs(line.end.y - ds.y.c.min) < Math.abs(ds.y.c.max - line.end.y) ? '0' : '1';
		}

		return {x: AB, y: BC, line: distSqr(line.end,line.start), corner: hor + ver};

}

// to make proper period objects
export function makePeriod(p){ return date.makePeriod(p);}
