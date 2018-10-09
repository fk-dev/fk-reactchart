import { isNil, mgr as typeMgr } from '../core/utils.js';
import { map } from 'underscore';

const nInterval = (length, height) => {
	const width = height * 3.5 / 2;
	return Math.max(Math.min(Math.floor(length/width), 10), 1);
};

/*
 * beware of distance (period) versus
 * values (date), see {date,nbr}Mgr.js
*/
const computeTicks = function(first, last, step, minor, mStep, fac, toPixel, height){
	let mgr = typeMgr(first);
	// smart guess
	let start = mgr.closestRoundUp(first,mgr.divide(mgr.distance(first,last),10));
	let length = mgr.distance(start,last);

	// distance min criteria 1
	// 10 ticks max
	let dec = mgr.divide(length,nInterval(mgr.getValue(length) * toPixel, height));
		// we ensure we have a correctly defined step
	let majDist = mgr.isValidStep(step)  ? mgr.multiply(step,1)  : mgr.roundUp(dec);
	if(step && !isNil(step.offset)){
		majDist.offset = step.offset;
	}
	let minDist = mgr.isValidStep(mStep) ? mgr.multiply(mStep,1) : mgr.roundDown(majDist);
	if(mStep && !isNil(mStep.offset)){
		minDist.offset = mStep.offset;
	}

// redefine start to have the biggest rounded value
	let biggestRounded = mgr.orderMagValue(last,first);
	start = isNil(biggestRounded) ? start : biggestRounded;
	while(mgr.greaterThan(start,first) || mgr.equal(start,first)){
		start = mgr.subtract(start,majDist);
	}
	start = mgr.add(start,majDist);
	length = mgr.distance(start,last);
	let llength = mgr.multiply(majDist,mgr.labelF);

	let out = [];
	let curValue = start;
	while(mgr.lowerThan(curValue,last)){
		let fte = mgr.distance(curValue,first);
		out.push({
			position: curValue,
			offset: {
				along: mgr.offset(majDist),
				perp: 0
			},
			extra: false,
			label: mgr.type !== 'date' || ( mgr.greaterThan(fte, llength) || !majDist.offset ) ? mgr.label(curValue,majDist,fac) : '',
			minor: false
		});
		// minor ticks
		if(minor){
			let curminValue = mgr.add(curValue,minDist);
			let ceil = mgr.add(curValue,majDist);
			while(mgr.lowerThan(curminValue,ceil)){
				if(mgr.greaterThan(curminValue,last)){
					break;
				}
				out.push({
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
			}
		}

		curValue = mgr.add(curValue,majDist);
		if(mgr.isZero(majDist)){
			break;
		}
	}

	out = out.concat(mgr.extraTicks(majDist,first,last, out));
	return out;
};

export function ticks(start, length, majStep, labels, minor, minStep, fac, toPixel, height){
	if(!!labels && labels.length > 0){
		return map(labels, (lab) => {
			return {
				position: lab.coord, 
				label: lab.label, 
				offset: {
					along: 0,
					perp: 0
				}
			};
		});
	}

	return computeTicks(start, length, majStep, minor, minStep, fac, toPixel, height);
}
