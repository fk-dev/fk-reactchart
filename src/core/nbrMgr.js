const { pow, floor, log, abs, LN10 } = Math;

const suffixes = {
	18: 'E', // exa
	15: 'P', // peta
	12: 'T', // tera
	9: 'G',  // giga
	6: 'M',  // mega
	3: 'k',  // kilo
  0: '',   // unit
	'-3': 'm', // milli
	'-6': '\u03BC', // micro
	'-9': 'n', // nano
	'-12': 'p', // pico
	'-15': 'f', // femto
	'-18': 'a' // atto
};

const lastDigitOrder = nbr => {
	const str = '' + nbr;
	let i = 0;
	let nz = 0;
	for(let l = 0; l < str.length; l++){
		if(str[l] === '0'){
			nz++;
		}else{
			nz = 0;
			i = l;
		}
		if(nz === 3){
			return i;
		}
	}

	return i;
};

const firstDigit = function(r,n){
  n = n || 1;
	let res = r * pow(10,-orderMag(r));
	let str = '' + res;
	let out = str[0] || 0;
	if(n > 1){
		out += str.substr(1,n);
	}
	return Number(out);
};

const firstNonNull = function(v){
	let str = v + '';
	let com = str.indexOf('.');
	if(com < 0){
		return 0;
	}
	let i, out;
	for (i = str.length - 1; i >= 0; i--){
		if(str[i] !== '0'){
			break;
		}
	}
	out = i - com;
	return Math.max(out,0);
};

const roundMe = function(min,max){
	const valOrder = orderMag(max);
	const distOrd = orderMag(distance(max,min));

	const valid = (cand) => cand >= min && cand <= max;

	const ref = pow(10,valOrder + 1);
	let val = ref; // 10
	if(!valid(val)){
		val = ref / 2; // 5
	}
	if(!valid(val)){
		val = ref / 5; // 2
	}
	if(!valid(val)){
		val = ref / 10; // 1
	}

	if(!valid(val)){ // last chance
		if(distOrd < valOrder){
			const step = pow(10,distOrd);
			return floor(min / step) * step + step;
		}else{ // distOrd === valOrder
			return min;
		}
	}
	return val;
};

const scientific = (val, orMax) => {
	let om = orderMag(val);
	let face = val / pow(10,om);
	while(face >= 10){
		face /= 10;
		om += 1;
	}

	let maxV = Math.max(om - orMax + 1, 0);
	let f = Math.min(firstNonNull(face), maxV);

	return {base: face.toFixed(f), power: om};
};

const suffixe = (order) => {
	let num = order % 3 === 0 ? order : (order - 1) % 3 === 0 ? order - 1 : order - 2;
	return {
		num, 
		string: suffixes[num]
	};
};

const natural = (val, orMax) => {
	let om = orderMag(val);
	let { num, string } = suffixe(om);
	let base = val / pow(10, num);
	while(base >= 1e3){
		base /= 1e3;
		om += 3;
		string = suffixe(om).string;
	}

	let maxV = Math.max(om - orMax + 1, 0);
	let comp = firstNonNull(base);
	let f = Math.min(comp, maxV);

	return base.toFixed(f) + string;
};

const labelFromType = (type, dist) => {

	switch(type){
		case 'sci':
			return (val) => scientific(val, orderMag(dist));
		case 'nat':
			return (val) => natural(val, orderMag(dist));
		default:
			return () => false;
	}
};

// distance methods
export function orderMag(r){
	if(r < 0){
		r = -r;
	}
	return (r === 0) ? 0 : floor( log(r) / LN10);
}
export function orderMagValue (max,min){

	// zero case treated right away
	if(min * max < 0){
		return 0;
	}
	let absMin = max < 0 ? Math.abs(max) : min;
	let absMax = max < 0 ? Math.abs(min) : max;
	let fac = max < 0 ? -1 : 1;
	return fac * roundMe(absMin,absMax);
}

export function orderMagDist(max, min){
	return orderMagValue(max, min);
}

export function roundUp(r){
	let step = (val) => {
		switch(firstDigit(val)){
			case 2:
				return 5 * pow(10, orderMag(cand));
			default:
				return 2 * cand;
		}
		
	};
	let cand = pow(10, orderMag(r));
	while(cand <= r){
		cand = step(cand);
	}

	let test = cand * pow(10, -orderMag(cand)); // between 0 and 1
	if(test > 6){
		cand = pow(10, orderMag(cand) + 1);
	}
	return cand;
}

export function roundDown(r){
	let step = 5 * pow(10, orderMag(r) - 1);
	let cand = firstDigit(r) * pow(10, orderMag(r));
	while(cand >= r){
		cand -= step;
	}

	return cand;
}

// value methods
export function closestRoundUp(ref,dist){

	dist = Math.abs(dist);

	if(ref < 0){
		return - closestRoundDown(-ref,dist);
	}

	const refOm = orderMag(ref);
	let upperBound = pow(10,refOm + 1) * firstDigit(ref);
	if(upperBound / 5 > ref){
		upperBound /= 5;
	}else if(upperBound / 2 > ref){
		upperBound /= 2;
	}
	let start = pow(10,refOm) * firstDigit(ref);
	const or = orderMag(ref - start)  - orderMag(dist);
	if(or > 2){
		start = pow(10,refOm) * firstDigit(ref,or - 2);
	}
	while(start <= ref){
		start += dist;
	}
	return Math.min(start,upperBound);
}

export function closestRoundDown(ref,dist){

	if(ref < 0){
		return - closestRoundUp(-ref,dist);
	}

	const refOm = orderMag(ref);
	const om = orderMag(dist);
	let upperBound = pow(10,refOm) * (firstDigit(ref) - 1);
	if(upperBound * 10 < ref){
		upperBound *= 10;
	}else if(upperBound * 5 < ref){
		upperBound *= 5;
	}else if(upperBound * 2 < ref){
		upperBound *= 2;
	}
	let start = pow(10,refOm) * firstDigit(ref);
	if(refOm !== om){
		while(start < ref){
			start += dist;
		}
	}

	while(start >= ref){
		start -= dist;
	}

	return Math.max(start,upperBound);
}

// value & distance methods
export function closestRound(ref,dist,type){
	return (type === 'up') ? closestRoundUp(ref,dist) : closestRoundDown(ref,dist);
}

export function min(values){ 
	if(values.length < 50001){
		return Math.min.apply(null,values);
	}else{
		let m = values[0];
		for(let i = 1; i < values.length; i++){
			m = m > values[i] ? values[i] : m ;
		}
		return m;
	}
}

export function max(values){ 
	if(values.length < 50001){
		return Math.max.apply(null,values);
	}else{
		let m = values[0];
		for(let i = 1; i < values.length; i++){
			m = m < values[i] ? values[i] : m ;
		}
		return m;
	}
}

export function label(value, dist, fac){ 
	const o = Math.min(Math.max(-orderMag(dist),0),20);
	return (value / fac).toFixed(o);
}

// if equality, b is preffered
export function betterStep(a,b){
	// order mag, then %10 > %5 > 2 || 1 > any other

	const omA = lastDigitOrder(a);
	const omB = lastDigitOrder(b);
	if(omA < omB){
		return a;
	}else if(omB < omA){
		return b;
	}

		// %10
	if(b%10 === 0){
		return b;
	}
	if(a%10 === 0){
		return a;
	}

		// %5 || 2 (case 5 vs 2)
	if(b%5 === 0 || b === 2){
		return b;
	}

	if(a%5 === 0){
		return a;
	}

	// 2 || 1 
	if(b === 1){
		return b;
	}
	if(a === 2 || a === 1){
		return a;
	}

	return b;

}

export function multiply(d,f){ return d * f;}

export function divide(d,f){ return d / f;}

export function increase(d1,d2){ return d1 + d2;}

export function offset(/*d*/){ return 0;}

export function add(d1,d2){ return d1 + d2;}

export function subtract(d1,d2){ return d1 - d2;}

export function distance(d1,d2){ return abs(d1 - d2);}

export function greaterThan(v1,v2){ return v1 > v2;}

export function lowerThan(v1,v2){ return v1 < v2;}

export function equal(v1,v2){ return v1 === v2;}

// some management
export function extraTicks(){ return [];}

export function getValue(v){ return v;}
export function value(v){ return getValue(v);}
export function step(v){ return getValue(v);}

export function isValidStep(v){ return v !== null && v !== undefined;}

export function smallestStep(){ return 1;}

// management
export function labelize(type, dist){ return labelFromType(type, dist);}

//
export function defaultSpan(){ return 10;}

export const labelF = 0.75;

export const type = 'number';

export function isZero(v){ return v < 1e-15;}

export function autoFactor(ma,mi){
  let orMax = orderMag(ma);
  let orMin = orderMag(mi);
  let a = Math.min(orMax, orMin);
  let b = Math.max(orMax, orMin);
  
  return b - a < 3 ? pow(10,a) : pow(10,b);
}
