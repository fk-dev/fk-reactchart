import { isNil, mgr as typeMgr } from '../core/utils.js';
import { map } from 'underscore';

const nInterval = (length, height) => {
	const width = height * 3.5 / 2;
	return Math.max(Math.min(Math.floor(length/width), 10), 1);
};


const checkMajDist = (labels,ref,D,start,cv, getLength,mgr) => {
	const lls = labels.map(x => getLength(x.label)).filter(x => x);
	const max = lls.reduce( (memo,v) => memo < v ?  v : memo, -1);
	const d = D - (lls[0]/2 + lls[1]/2);

	if(d > max + 2 * getLength()){
		const incr = Math.floor((max * 1.2)/d) + 1;
		let cand;
		for(let i = 0; i < incr; i++){
			cand = mgr.roundDown(ref);
		}
		cand = mgr.betterStep(ref,cand);
		return {
			majDist: cand,
			curValue: start,
			store: cand === ref ? labels : []
		};
	}else if(d < 0){
		labels = [];
		return {
			majDist: mgr.roundUp(ref),
			curValue: start,
			store: []
		};
	}else{
		return {
			curValue: cv,
			majDist: ref,
			store: labels
		};
	}
};

/*
 * beware of distance (period) versus
 * values (date), see {date,nbr}Mgr.js
*/
const computeTicks = function(first, last, step, majLabelize, minor, mStep, minLabelize, fac, toPixel, height, square, outer){
	const mgr = typeMgr(first);
	// smart guess
	let start = mgr.closestRoundUp(first,mgr.divide(mgr.distance(first,last),10));
	let length = mgr.distance(start,last);
	// in px
	const upperBounds = mgr.getValue(mgr.distance(first,last));

	// distance min criteria 1
	// 10 ticks max
	let dec = mgr.divide(length,nInterval(mgr.getValue(length) * toPixel,height));
	// at least one
	let ALO = mgr.subtract(length, dec);
	while(mgr.lowerThan(ALO,mgr.value(0,true)) || mgr.isZero(ALO)){
		dec = mgr.divide(dec,2);
		ALO = mgr.subtract(length, dec);
	}
		// we ensure we have a correctly defined step
		// might be subject to change
	let majDist = mgr.isValidStep(step)  ? mgr.multiply(step,1)  : mgr.roundUp(dec);
	if(step && !isNil(step.offset)){
		majDist.offset = step.offset;
	}

	const minDist = mgr.isValidStep(mStep) ? mgr.multiply(mStep,1) : mgr.roundDown(majDist);
	if(mStep && !isNil(mStep.offset)){
		minDist.offset = mStep.offset;
	}

// redefine start to have the biggest rounded value
	const biggestRounded = mgr.orderMagValue(last,first);
	start = isNil(biggestRounded) ? start : biggestRounded;
	while(mgr.greaterThan(start,first) || mgr.equal(start,first)){
		start = mgr.subtract(start,majDist);
	}
	start = mgr.add(start,majDist);
	length = mgr.distance(start,last);
	//const llength = mgr.getValue(mgr.multiply(majDist,mgr.labelF)) * toPixel;

	let out = [];
	let curValue = start;
	let along = mgr.offset(majDist);
	let tries = majDist;
// careful for infinite looping
	if(isNil(curValue) || isNil(majDist)){
		throw new Error("Ticker cannot compute with nil");
	}
	let cycle = false;
	while(mgr.lowerThan(curValue,last)){
		if(!cycle && out.length === 4 && !minor && square){
			out.forEach( (t,i) => {
				t.label = majLabelize(out,i,mgr.label(t.position,majDist,fac));
			});
			const reset = checkMajDist(out,majDist, mgr.getValue(majDist) * toPixel, start, curValue, square, mgr);
			if(mgr.greaterThan(reset.majDist,tries)){
				tries = reset.majDist;
			}else if(mgr.equal(reset.majDist,tries) && reset.store.length === 0){
				cycle = true;
			}
			curValue = reset.curValue;
			majDist = reset.majDist;
			out = reset.store;
			along = mgr.offset(majDist);
		}
		out.push({
			type: 'major',
			position: curValue,
			offset: {
				along,
				perp: 0
			},
			extra: false,
			label: null,
			minor: false
		});
		// minor ticks
		if(minor){
			let curminValue = mgr.add(curValue,minDist);
			const ceil = mgr.add(curValue,majDist);
			while(mgr.lowerThan(curminValue,ceil) && mgr.lowerThan(curminValue,last)){
				out.push({
					type: 'minor',
					position: curminValue,
					offset: {
						along: mgr.offset(minDist),
						perp: 0
					},
					extra: false,
					label: mgr.label(curminValue,minDist,fac),
					minor: true
				});
				curminValue = mgr.add(curminValue,minDist);
				if(mgr.isZero(minDist)){
					break;
				}
			}
		}

		curValue = mgr.add(curValue,majDist);
		if(mgr.isZero(majDist)){
			break;
		}
	}

	// labelize
	out.forEach( (tick,idx) => {
		if(isNil(tick.label)){
			tick.label = majLabelize(out,idx,mgr.label(tick.position,majDist,fac));
		}
	});

	const checkBorder = (datum,dist, comp) => {
		const { position, offset, label } = datum;
		const fl = square(label, true);
		const labelPos = mgr.add(position,offset.along);
		const d = dist(labelPos);
		return comp(d,fl);
	};

	const tick = (position,p) => {
		const tick = {
			type: `borders-${minor ? 'minor' : 'major'}`,
			position,
			offset: {
				along: mgr.offset(minor ? minDist : majDist),
				perp: 0
			},
			show: false,
			label: '',
			minor
		};
		if(p === 0){
			out.unshift(tick);
		}else{
			out.push(tick);
		}
		tick.label =  minor ? minLabelize(out,p,mgr.label(position,minDist,fac)) : majLabelize(out,p,mgr.label(position,majDist,fac));
		return tick;
	};

		// we do nothing if no ticks => there's a problem
	if(out.length){
		// can we see the first label
		if(checkBorder(out[0], 
			labelPos => mgr.lowerThan(labelPos, first) ? - upperBounds : mgr.getValue( mgr.distance( labelPos, first) ) * toPixel,
			(dist,fl) => dist + outer.min < fl / 2 // we can go a little more that the origin
		)){
			out[0].label = '';
		}
		// can we see the last label
		if(checkBorder(out[out.length - 1], 
			labelPos => mgr.greaterThan(labelPos, last) ? -2 * upperBounds : mgr.getValue( mgr.distance( labelPos, last) ) * toPixel,
			(dist,fl) => dist + outer.min < fl / 2
		)){
			out[out.length - 1].label = '';
		}
		// can we see the one before the first label
		let position = mgr.subtract(start, minor ? minDist : majDist);
		const preTick = tick(position,0);
		if(checkBorder(preTick, 
			labelPos => mgr.lowerThan(labelPos, first) ? - upperBounds : mgr.getValue( mgr.distance( labelPos, first) ) * toPixel,
			(dist,fl) => dist + outer.min < fl / 2
		)){
			out.shift();
		}
		// can we see the one after the last label
		position = mgr.add(start, minor ? minDist : majDist);
		const posTick = tick(position,out.length);
		if(checkBorder(posTick, 
			labelPos => mgr.lowerThan(labelPos, first) ? - upperBounds : mgr.getValue( mgr.distance( labelPos, first) ) * toPixel,
			(dist,fl) => dist + outer.min < fl / 2
		)){
			out.pop();
		}

	}

	out = out.concat(mgr.extraTicks(majDist,first,last, out));
	return out;
};

export function ticks(start, length, majStep, labels, majLabelize, minor, minStep, minLabelize, fac, toPixel, height, square, outer){
	if(labels && labels.length > 0){
		return map(labels, (lab) => {
			return {
				position: lab.coord, 
				label: lab.label, 
				offset: {
					along: 0,
					perp: 0
				},
				type: 'major'
			};
		});
	}

	return computeTicks(start, length, majStep, majLabelize, minor, minStep, minLabelize, fac, toPixel, height, square, outer);
}
