/* global document */
import * as date from './dateMgr.js';
import * as nbr from './nbrMgr.js';

const isPeriod = function(v){
	let out = false;
	for(let t in {years: true, 	months: true, weeks: true, days: true}){
		out = out || !isNil(v[t]);
	}
	return out;
};

export { misc as math } from './mathMgr.js';

export function isDate(v){ return v && (v instanceof Date || isPeriod(v));}

export function isArray(v){ return v && Array.isArray(v);}

export function isString(v){ return v && typeof v === 'string';}

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

export function computeSquare(angle,width,height){
	const aLength = (c,s) => Math.abs(Math.cos(angle) * c ) + Math.abs(Math.sin(angle) * s );

	return {
		width: aLength(width,height),
		height: aLength(height,width)
	};

}

export function measure(gid){

	let mother = typeof document === 'undefined' ? null : document.getElementById(`fkchartmeasurer-${gid}`);

	let active = false;

	if(isNil(mother)){
		return {
			text: (txt,fs) => {
				return {
					width:  txt.length * toNumber(fs) * 2/3, 
					height: toNumber(fs)
				};
			},
			cadratin: (props) => {
				const { titleFSize } = props;

				const places = {left: 'ord', right: 'ord', bottom: 'abs', top: 'abs'};

				// axis label
				// ticks label
				let axisLabel = {};
				let tickLabel = {};
				for(let u in places){
					axisLabel[u] = ( props.axisProps[places[u]].find(x => x.placement === u) || {labelFSize: 0}).labelFSize;
					tickLabel[u] = ( props.axisProps[places[u]].find(x => x.placement === u) || {ticks: { major: {labelFSize: 0} } }).ticks.major.labelFSize;
				}
				return {
					title: titleFSize,
					axisLabel,
					tickLabel
				};
			},
			active
		};
	}

	active = true;

	const _measureText = (str, fontSize, clN) => {
		if(!str){
			return { width: 0, height: 0};
		}

		if(clN){
			mother.setAttribute('class', clN);
			mother.style.fontSize = "";
		}else{
			mother.style.fontSize = typeof fontSize === 'number' ? `${fontSize}pt` : fontSize;
			mother.removeAttribute('class');
		}
		mother.innerHTML = str;
		const rect = mother.getBoundingClientRect();
		const { width, height }  = rect;

		if(fontSize && width === 0 && height === 0){
			active = false;
		}

		return { width, height };
	};

	const measureText = (texts,fontSize,cn) => {

		if(!Array.isArray(texts)){
			texts = [texts];
		}

		const compare = (ref,cand) => {
			const width  = ref.width  > cand.width  ? ref.width  : cand.width;
			const height = ref.height > cand.height ? ref.height : cand.height;
			return {width, height};
		};

		return texts.map( str => _measureText(str,fontSize,cn )).reduce( (memo,v) => compare(memo,v) , {width: 0, height: 0});
	};

	const cadratin = (props) => {

		// title
		const { titleFSize, css } = props;
		

		const getCadratin = (fs,cn) => _measureText('&mdash;', fs, css ? cn : null).width;

		const places = {left: 'ord', right: 'ord', bottom: 'abs', top: 'abs'};
		const axe    = {left: 'y',   right: 'y',   bottom: 'x',   top: 'x'};

		// axis label
		// ticks label
		let axisLabel = {};
		let tickLabel = {};
		for(let u in places){
			axisLabel[u] = getCadratin( ( props.axisProps[places[u]].find(x => x.placement === u) || {labelFSize: 0}).labelFSize, `${axe[u]}AxisLabel`);
			tickLabel[u] = getCadratin( ( props.axisProps[places[u]].find(x => x.placement === u) || {ticks: { major: {labelFSize: 0} } }).ticks.major.labelFSize, `${axe[u]}AxisTickLabel`);
		}

		return {
			title: getCadratin(titleFSize),
			axisLabel,
			tickLabel
		};
	};

	const kill = () => {
		mother = null;
	};

	return {
		text: measureText,
		cadratin,
		active,
		kill
	};

}

const letters = 'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN^$*,;:!<&(-_)=¨£%µ?./§>1234567890~#{[|@]}+';
const rnd = () => letters.charAt(Math.floor(Math.random() * letters.length));

// 3 letters
export function rndKey(){
	return rnd() + rnd() + rnd();
}

// font sizes
export function toNumber(fs){
	let num = Number(fs);
	let c = fs.length - 1;
	while(isNaN(num) && c){
		num = Number(fs.substring(0,c));
		c--;
	}

	return isNaN(num) ? 0 : num;
}
