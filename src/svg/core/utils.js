/* global document*/
import * as date from './dateMgr.js';
import * as nbr from './nbrMgr.js';
import { renderTextOptions } from '../marks/label-text.jsx';

const hasWindow   = () => typeof window !== 'undefined';
const hasDocument = () => typeof document !== 'undefined';

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

export function isString(v){ return !isNil(v) && typeof v === 'string';}

export function isNil(v){ return v === null || v === undefined;}

export function isValidNumber(r){ return !isNil(r) && !isNaN(r) && isFinite(r);}

export function isValidParam(p){ return isDate(p) || isString(p) || isValidNumber(p);}

export function deepCp(tgt,thing){

	if(isNil(thing)){ // null has a meaning
		return isNil(tgt) && thing === null ? null : tgt;
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

export function mgr(ex){ 

	const _fromEx     = _ex => isDate(_ex) ? date : nbr;
	const _fromString = _ex => _ex === 'date' ? date : nbr;

  return typeof ex === 'string' ? _fromString(ex) : _fromEx(ex);
}

export function homothe(src,tgt,fac,val){
	const t = isDate(tgt) ? date.getValue(tgt) : tgt;
	const v = isDate(val) ? date.getValue(val) : val;
	const s = isDate(src) ? date.getValue(src) : src;
	const sol = t + (v - s) * fac;
  return ( isDate(tgt) ) ? new Date(sol) : sol ;
}

export function toValue(val){ return isDate(val) ? date.getValue(val) : val;}

export const coord = {

	cart: (r,theta) => {
		return {
			x: r * Math.cos(theta),
			y: r * Math.sin(theta)
		};
	},
	polar: (x,y) => {
		return {
			r: Math.sqrt(x*x + y*y),
			theta: (Math.atan(-y/x) + Math.PI/2)%(2*Math.PI)
		};
	}

};

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

		if(Array.isArray(line.start)){
			return line.start.map( (s,i) => direction({start: s, end: line.end[i]}, ds));
		}

		const distSqr = (p1,p2) => (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
		const B = {x: line.end.x, y: line.start.y};
		const AB = distSqr(line.start,B);
		const BC = distSqr(B,line.end);

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

export function measure(gid, debug){

	debug = debug || { log: () => null };

	let active = hasDocument() && gid && document.getElementById(`fkchartmeasurer-${gid}`) ? true : false;

	const factor = hasWindow() && window.nightmare && window.nightmare.corFactor ? window.nightmare.corFactor : 1;

	//debug.log(`window is ${typeof window !== 'undefined' ? window : 'undefined'}, window.nightmare is ${typeof window !== 'undefined' ? window.nightmare : 'undefined'}, factor is ${typeof window !== 'undefined' && window.nightmare ? window.nightmare.corFactor : 'undefined'}`);
	debug.log(`factor is ${factor}`);

	if(!active){
		if(debug){
			debug.log("No document object found, using old style measurements.");
		}
		return {
			text: (txt,fs) => {

				const lineHeight = toNumber(fs);

				const _meas = x => {
					const texts = renderTextOptions({fs},x);
					let tWidth = 0; 

					const oneMeasure = txt => {
						const width = txt.length * lineHeight * 2/3;
						tWidth   = width > tWidth ? width : tWidth;
					};

					// \n => (x,y) = (-10,-10) in Measurer.jsx
					texts.forEach( ({line}) => oneMeasure(line));
					return {width: tWidth, height: lineHeight * texts.length};
				};

				txt = Array.isArray(txt) ? txt : [txt];
				const ls = txt.map(_meas).concat({width:0,height:0});

				const width  = Math.max.apply(null,ls.map(x => x.width));
				const height = Math.max.apply(null,ls.map(x => x.height));
				debug.log(`Old Style Measurements: will return (width, heigh) = (${width},${height}) for text = ${txt} at font size ${fs}`);
				return { width, height, lineHeight};
			},
			cadratin: (props) => {
				const { titleFSize } = props.titleProps;

				const places = {left: 'ord', right: 'ord', bottom: 'abs', top: 'abs', r: 'polar'};

				// axis label
				// ticks label
				let axisLabel = {};
				let tickLabel = {};
				for(let u in places){
					if(props.axisProps[places[u]] && props.axisProps[places[u]].length){
						axisLabel[u] = ( props.axisProps[places[u]].find(x => x.placement === u)?.labelFSize || 0 );
						tickLabel[u] = ( props.axisProps[places[u]].find(x => x.placement === u)?.ticks?.major?.labelFSize || 0 );
					}
				}
				const cad = {
					title: titleFSize,
					axisLabel,
					tickLabel
				};
				debug.log(`Old Style Measurements: cadratin measurements: ${JSON.stringify(cad)}`);
				return cad;
			},
			setDebug: x => {debug = x;},
			active
		};
	}

	active = true;
	if(debug){
		debug.log("Document object found, will measure.");
	}

	const _measureText = (str, fontSize, clNs) => {
		if(!str){
			return { width: 0, height: 0, lineHeight: 0};
		}
		clNs = clNs ? Array.isArray(clNs) ? clNs.map(x => x.split(' ')[0]) : clNs.split(' ')[0] : null;

		const clN = Array.isArray(clNs) ? clNs[clNs.length - 1] : clNs;
		const elt = `fkchartmeasurer-${gid}${clN ? `-${clN}` : '-text'}`;
		let meas = hasDocument() ? document.getElementById(elt) : null;
		if(!meas){
			const cc = Array.isArray(clNs) ? clNs : [clNs];
			let father = document.getElementById(`fkchartmeasurer-${gid}`) || document.body;
			for(let i = 0; i < cc.length; i++){
				const c = `fkchartmeasurer-${gid}${clN ? `-${cc[i]}` : ''}`;
				meas = document.getElementById(c);
				if(!meas){
					meas = document.createElement(i === cc.length - 1 ? 'text' : 'g');
					meas.setAttribute('class',cc[i]);
					meas.setAttribute('id',c);
					father.appendChild(meas);
				}
				father = meas;
			}
		}
		if(clN || !fontSize){
			meas.style.fontSize = "";
		}else{
			meas.style.fontSize = typeof fontSize === 'number' ? `${fontSize}pt` : fontSize;
		}

		const texts = renderTextOptions({fontSize},str);
		let tWidth = 0; 
		let tHeight = 0;
		let tLineHeight = 0;

		const oneMeasure = txt => {
			meas.innerHTML = txt;
			const { width, height }  = meas.getBoundingClientRect();
			tWidth   = width > tWidth ? width : tWidth;
			tLineHeight = height > tLineHeight ? height : tLineHeight;
		};

		// \n => (x,y) = (-10,-10) in Measurer.jsx
		texts.forEach( ({line}) => oneMeasure(line));
		// reinit, no style
		meas.style.fontSize = "";

		tHeight = tLineHeight * texts.length;

		/// this 0.6 factor we can't (yet) explain...
		const cwidth      = factor * tWidth;
		const cheight     = factor * tHeight;
		const clineHeight = factor * tLineHeight;

		if(fontSize && tWidth === 0 && tHeight === 0){
			active = false;
		}

		debug.log(`Actual Measurements: will return (width, height, lineHeight) = (${cwidth},${cheight},${clineHeight}) for text = ${str} ${clN ? `for class name ${clN}` : `at font size ${fontSize}`}`);

		return { width: cwidth, height: cheight, lineHeight: clineHeight };
	};

	const measureText = (texts,fontSize,cn) => {

		if(!Array.isArray(texts)){
			texts = [texts];
		}

		const compare = (ref,cand) => {
			const width      = ref.width  > cand.width  ? ref.width  : cand.width;
			const height     = ref.height > cand.height ? ref.height : cand.height;
			const lineHeight = ref.lineHeight > cand.lineHeight ? ref.lineHeight : cand.lineHeight;
			return {width, height, lineHeight};
		};

		return texts.map( str => _measureText(str,fontSize,cn )).reduce( (memo,v) => compare(memo,v) , {width: 0, height: 0, lineHeight: 0});
	};

	const cadratin = (props) => {

		// title
		const { titleFSize, css } = props;
		

		const getCadratin = (fs,cn) => _measureText('&mdash;', fs, css ? cn : null).width;

		const places = {left: 'ord', right: 'ord', bottom: 'abs', top: 'abs', r: 'polar'};

		// axis label
		// ticks label
		let axisLabel = {};
		let tickLabel = {};
		for(let u in places){
			axisLabel[u] = getCadratin( ( props.axisProps[places[u]]?.find(x => x.placement === u)?.labelFSize || 0 ), `axis-label-${u}`);
			tickLabel[u] = getCadratin( ( props.axisProps[places[u]]?.find(x => x.placement === u)?.ticks?.major?.labelFSize || 0 ), `label-major-${u}`);
		}

		const cad = {
			title: getCadratin(titleFSize),
			axisLabel,
			tickLabel	
		};
		debug.log(`Actual Measurements: cadratin measurements: ${JSON.stringify(cad)}`);

		return cad;
	};

	const calibrate = (props) => {
		// css
		const { css } = props; 
		// title
		const { titleFSize } = props.titleProps;
		const title = _measureText('Chart title',titleFSize,css ? 'title' : '');
		// axis label
		// axis ticks
		let axis  = {};
		let ticks = {};
		["abs","ord", "polar"].forEach(a => (props.axisProps[a] || []).forEach( ax => {
			const { placement, factorFSize, labelFSize } = ax;
			if(!placement){
				return;
			}
			axis[placement] = {
				factor: _measureText(`${placement} factor`,factorFSize,css ? 'axis-factor' : ''),
				label: _measureText(`${placement} label`,labelFSize,css ? 'axis-factor' : ''),
			};
			const { major, minor } = ax?.ticks || {};
			ticks[placement] = {
				major: _measureText(`${placement} major ticks`,major?.labelFSize, css ? 'label-major' : ''),
				minor: _measureText(`${placement} minor ticks`,minor?.labelFSize, css ? 'label-minor' : '')
			};
		}));

		return {
			title,
			axis,
			ticks
		};
	};

	const checkMeasure = () => {
		const { width, height } = _measureText('TEST TEXT',16);
		return width !== 0 && height !== 0;
	};

	const ok = checkMeasure();

	return {
		text: measureText,
		cadratin,
		ok,
		checkMeasure,
		active,
		setDebug: x => {debug = x;},
		calibrate
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

export const emptyState = {cadre: { width: 480, height: 270 }, background: {}, empty: true, width: 300, height: 200};

export const reinitOn = (mgr,waitFor) => {

	const defWaitFor = hasDocument() && document.fonts && document.fonts.ready ? [document.fonts.ready.then(() => null)] : []; // nothing is passed to reinit

	const waitForUs = waitFor ? defWaitFor.concat(waitFor) : defWaitFor;
	for(let p = 0; p < waitForUs.length; p++){
		waitForUs[p].then((newProps) => mgr.reinit(newProps));
	}
};

function doOpe(a,b,ope){
	const _mgr = mgr(a);
	return _mgr[ope](a,b);
}

export const arOp = {
	add:      (a,b) => doOpe(a,b,'add'), 
	subtract: (a,b) => doOpe(a,b,'subtract'), 
	multiply: (a,b) => doOpe(a,b,'multiply'), 
	divide:   (a,b) => doOpe(a,b,'divide')
};
