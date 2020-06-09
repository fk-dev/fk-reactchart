import { isNil, mgr as typeMgr } from '../core/utils.js';

const nInterval = (length, height) => {
	const width = height * 3.5 / 2;
	return Math.max(Math.min(Math.floor(length/width), 10), 1);
};


const checkMajDist = (labels,ref,D,first,cv, getLength, mgr, starter, spaceFac) => {
	const lls = labels.map(x => getLength(x.label)).filter(x => x);
	const max = lls.reduce( (memo,v) => memo < v ?  v : memo, 0);
	const d = D - max;

	if(d > max * ( 1 + spaceFac ) + 2 * getLength() ){
		const incr = Math.floor((max * 1.2)/d) + 1;
		let cand;
		for(let i = 0; i < incr; i++){
			cand = mgr.roundDown(ref);
		}
		cand = mgr.betterStep(ref,cand);
		return {
			majDist: cand,
			curValue: cand === ref ? cv : starter(cand),//mgr.closestRoundUp(first, mgr.type === 'date' ? mgr.add(cand, {days: 1}) : cand),
			store: cand === ref ? labels : []
		};
	}else if(d < max * spaceFac ){
		labels = [];
		const majDist = mgr.roundUp(ref);
		return {
			majDist,
			curValue: starter(majDist), //mgr.closestRoundUp(first, mgr.type === 'date' ? mgr.add(majDist, {days: 1}) : majDist),
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
const computeTicks = function(first, last, step, { majAuto, majLabelize, spaceFac}, minor, mStep, { minAuto, minLabelize }, fac, toPixel, height, square, outer){

	// mgr
	const mgr = typeMgr(first);

	// const
	const biggestRounded = mgr.orderMagValue(last,first);
	const guess = mgr.divide(mgr.distance(first,last),10);
	const mandatory = isNil(biggestRounded) ? mgr.closestRoundUp(first,guess) : biggestRounded;

	// utils
	const starter = (step) => {
		let start = mandatory;
		while(mgr.greaterThan(start,first) || mgr.equal(start,first)){
			start = mgr.subtract(start,step);
		}
		return mgr.add(start,step);
	};

	// let's go
	let start = starter(guess);
	let length = mgr.distance(start,last);
	// in px
	const upperBounds = mgr.getValue(mgr.distance(first,last)) * toPixel;

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

	length = mgr.distance(start,last);
	//const llength = mgr.getValue(mgr.multiply(majDist,mgr.labelF)) * toPixel;

	let tries = [majDist];
	const tickerBuilder = (n) => {
		let out = [];
// redefine start to have the closest rounded value if needed
		start = starter(majDist);
		let curValue = start;
		let along = mgr.offset(majDist);
	// careful for infinite looping
		if(isNil(curValue) || isNil(majDist)){
			throw new Error("Ticker cannot compute with nil");
		}
		let cycle = false;
		while(mgr.lowerThan(curValue,last)){
			if(!cycle && out.length === 4  && !minor && square){
				out.forEach( (t,i) => {
					t.label = majLabelize(out,i,mgr.label(t.position,majDist,fac));
				});
				const reset = checkMajDist(out,majDist, mgr.getValue(majDist) * toPixel, first, curValue, square, mgr, starter, spaceFac);
				if(tries.findIndex( t => mgr.equal(reset.majDist,t)) === -1){
					tries.push(reset.majDist);
				}else if(reset.store.length === 0){
					cycle = true;
				}
				curValue = reset.curValue;
				majDist = reset.majDist;
				out = reset.store;
				along = majAuto ?  mgr.offset(majDist) : 0;
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
							along: minAuto ? mgr.offset(minDist) : 0,
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

		if(out.length < 4 && out.length > 1 && !minor && square && n < 10){
			out.forEach( (t,i) => {
				t.label = majLabelize(out,i,mgr.label(t.position,majDist,fac));
			});
			const reset = checkMajDist(out,majDist, mgr.getValue(majDist) * toPixel, first, curValue, square, mgr, starter, spaceFac);
			if(tries.findIndex( t => mgr.equal(reset.majDist,t)) === -1){
				tries.push(reset.majDist);
			}else if(reset.store.length === 0){
				cycle = true;
			}
			if(reset.store.length){
				return out;
			}
			curValue = reset.curValue;
			majDist = reset.majDist;
			out = reset.store;
			along = mgr.offset(majDist);
			return tickerBuilder(n + 1);
		}else{
			return out;
		}

	};

	let out = tickerBuilder(0);

	// labelize
	out.forEach( (tick,idx) => {
		if(isNil(tick.label)){
			tick.label = majLabelize(out,idx,mgr.label(tick.position,majDist,fac));
		}
	});

	const checkBorder = (datum,dist, comp) => {
		const { position, offset, label } = datum;
		const fl = square(label);
		const labelPos = mgr.add(position,offset.along);
		const d = dist(labelPos);
		return comp(d,fl);
	};

	const tick = (position,p) => {

		const along = minor && minAuto ? mgr.offset(minDist) : !minor && majAuto ? mgr.offset(majDist) : 0;

		const tick = {
			type: `borders-${minor ? 'minor' : 'major'}`,
			position,
			offset: {
				along,
				perp: 0
			},
			show: false,
			showLabel: true,
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

		let checkMin  = true;
		let checkLast = true;

		// can we see the first label
		if(checkBorder(out[0], 
			labelPos => mgr.lowerThan(labelPos, first) ? - 2 * upperBounds : mgr.getValue( mgr.distance( labelPos, first) ) * toPixel,
			(dist,fl) => dist + outer.min.marginsO < fl / 2 // we can go a little more that the origin
		)){
			out[0].showLabel = false;
			checkMin = false;
		}
		// can we see the last label
		if(checkBorder(out[out.length - 1], 
			labelPos => mgr.greaterThan(labelPos, last) ? -2 * upperBounds : mgr.getValue( mgr.distance( labelPos, last) ) * toPixel,
			(dist,fl) => dist + outer.max.marginsO < fl / 2
		)){
			out[out.length - 1].showLabel = false;
			checkLast = false;
		}
		// can we see the one before the first label
		if(checkMin){
			const position = mgr.subtract(out[0].position, minor ? minDist : majDist);
			const preTick = tick(position,0);
			if(checkBorder(preTick, 
				labelPos => mgr.lowerThan(labelPos, first) ? - 2 * upperBounds : mgr.getValue( mgr.distance( labelPos, first) ) * toPixel,
				(dist,fl) => dist + outer.min.marginsO < fl / 2
			)){
				out.shift();
			}
		}

		// can we see the one after the last label
		if(checkLast){
			const position = mgr.add(out[out.length - 1].position, minor ? minDist : majDist);
			const posTick = tick(position,out.length);
			if(checkBorder(posTick, 
				labelPos => mgr.greaterThan(labelPos, last) ? - 2 * upperBounds : mgr.getValue( mgr.distance( last, labelPos) ) * toPixel,
				(dist,fl) => dist + outer.max.marginsO < fl / 2
			)){
				out.pop();
			}
		}

	}

	return out.concat(mgr.extraTicks(majDist,first,last, out));
};

export function ticks(start, length, majStep, labels, majProps, minor, minStep, minProps, fac, toPixel, height, square, outer){
	if(labels && labels.length > 0){
		return labels.map( lab => {
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

	return computeTicks(start, length, majStep, majProps, minor, minStep, minProps, fac, toPixel, height, square, outer);
}
