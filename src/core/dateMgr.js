import moment from 'moment';
import { map, findIndex } from 'underscore';
let im = {
	isImm: p => typeof p === 'object' ? Object.isFrozen(p) : false
};

let { pow, floor, log, abs, LN10 } = Math;

const _period = {years: true, months: true, weeks: true, days: true};
const _period_type = ['years','months','weeks','days'];

let utc = (d) => moment.utc(d).toDate();

// period = {
//	years : ,
//	months : ,
//	weeks : ,
//	days : ,
//	total: *nb days*
// }
let processPeriod = function(per, fac){
	fac = fac || 1;

	// don't touch immutable
	if(im.isImm(per)){
		return per.toJS();
	}

	let period = {};

	if(typeof per === 'number'){ // ms
		period = _makePeriod(moment.duration(per));
	}

	for(let t in _period){
		if(per[t] === null || per[t] === undefined){
			period[t] = 0;
		}else{
			period[t] = per[t] * fac;
		}
	}

	period.total = per.total === null || per.total === undefined ? moment.duration(period).asDays() : per.total * fac ;

  period.offset = per.offset;

	if(period.months > 0 && ( period.offset === null || period.offset === undefined ) ){
		period.offset = true;
	}

	return period;
};

let _makePeriod = function(msOrDur){
	let dur = msOrDur.years && typeof msOrDur.years === 'function' ? msOrDur : moment.duration(msOrDur);
	return {
		years:  dur.years(),
		months: dur.months(),
		weeks:  dur.weeks(),
		days:   dur.days() - 7 * dur.weeks(),
		total:  dur.asDays(),
		offset: Math.abs(dur.asMonths()) >= 3
	};
};

let fetchFormat = function(p){
	p = processPeriod(p);
	const { abs } = Math;
	if(p.years !== 0){
		return {
			string: 'YYYY',
			pref: ''
		};
	}else if(abs(p.months) >= 6){
		return {
			string: 'S/YY', // ce format n'existe pas, il est géré par la fonction qui appelle
			pref: 'S'
		};
	}else if(abs(p.months) >= 3){
		return {
			string: 'Q/YY',
			pref: 'T'
		};
	}else if(p.months !== 0){
		return {
			string: 'MM/YY',
			pref: ''
		};
	}else if(p.weeks !== 0){
		return {
			string: 'DD/MM/YY',
			pref: ''
		};
	}else{
		return {
			string: 'DD/MM/YY',
			pref: ''
		};
	}
};

const roundDownPeriod = function(p){

	const make = (lab,val) => {
		return {
			label: lab,
			val: val
		};
	};

	let out = {};
	if(p.total > moment.duration({years: 2}).asDays()){
		out = make('years',Math.max(floor(p.years)/10,1));
	}else if(p.total > moment.duration({years: 1}).asDays()){
		out = make('years',1);
	}else if(p.total >= moment.duration({months: 6}).asDays()){
		out = make('months', 6);
	}else if(p.total >= moment.duration({months: 3}).asDays()){
		out = make('months', 3);
	}else if(p.total >= moment.duration({months: 1}).asDays()){
		out = make('months', 1);
	}else if(p.total >= moment.duration({weeks: 2}).asDays()){
		out = make('weeks', 2);
	}else if(p.total >= moment.duration({weeks: 1}).asDays()){
		out = make('weeks', 1);
	}else{
		out = make('days', 1);
	}

	return out;
};

const roundUpPeriod = function(p){

	const make = (lab,val) => {
		return {
			label: lab,
			val: val
		};
	};

	let out = {};
	if(p.years !== 0){
		out = make('years',floor(p.years) + 1);
	}else if(p.months >= 6){
		out = make('years', 1);
	}else if(p.months >= 3){
		out = make('months', 6);
	}else if(p.months >= 1){
		out = make('months', 3);
	}else if(p.weeks >= 2){
		out = make('months', 1);
	}else if(p.weeks >= 1){
		out = make('weeks', 2);
	}else if(p.days >= 1){
		out = make('weeks', 1);
	}else{
		out = make('days', 1);
	}

	return out;
};

// round period of sale order of magnitude
// down by default
const roundPeriod = function(per,type){

	// copy
	let p = _makePeriod(per);

	type = type || 'down';

	let types = _period_type;

	let makeThis = (type,n) => {
		for(let t = 0; t < types.length; t++){
			if(type === types[t]){
				continue;
			}
			p[types[t]] = 0;
		}
		p[type] = n;
	};

	// 1/10 of years or 1
	// 6, 3 or 1 month(s)
	// 2 or 1 week(s)
	// 1 day
	let round = type === 'up' ? roundUpPeriod(p) : roundDownPeriod(p);
	makeThis(round.label,round.val);

	p.total = moment.duration(p).asDays();

	return _makePeriod(p);
};

let closestUp = function(date,per){
	let out = closestDown(date,per);
	while(out.getTime() <= date.getTime()){
		out = add(out,per);
	}

	return out;
};

// beginning of period
let closestDown = function(date,per){
	// day
	if(per.days !== 0){
		return moment.utc(date).subtract(per.days,'days').startOf('day').toDate();
	}
	// start of week: Sunday
	if(per.weeks !== 0){
		return moment.utc(date).subtract(per.weeks,'weeks').startOf("week").toDate();
	}
	// start of month
	if(per.months !== 0){
		let month = 0;
		while(month < date.getUTCMonth()){
			month += per.months;
		}
		month -= per.months;
		return utc(new Date(date.getUTCFullYear(),month,1));
	}
	// start of year
	if(per.years !== 0){
		return utc(new Date(date.getUTCFullYear(),0,1));
	}
};

let sameDoP = function(dop1,dop2){
	let b1 = dop1 instanceof Date;
	let b2 = dop2 instanceof Date;
	if(b1 !== b2){
		return null;
	}

	return (b1)?'date':'period';
};

let dateGT      = (d1,d2) => d1.getTime() > d2.getTime();

let dateLT      = (d1,d2) => d1.getTime() < d2.getTime();

let dateEQ      = (d1,d2) => d1.getTime() === d2.getTime();

let periodGT    = (p1,p2) => p1.total > p2.total;

let periodLT    = (p1,p2) => p1.total < p2.total;

let periodEQ    = (p1,p2) => p1.total === p2.total;

let _greaterThan = (v1,v2,type) => type === 'date' ? dateGT(v1,v2) : periodGT(v1,v2);

let _lowerThan   = (v1,v2,type) => type === 'date' ? dateLT(v1,v2) : periodLT(v1,v2);

let _equal       = (v1,v2,type) => type === 'date' ? dateEQ(v1,v2) : periodEQ(v1,v2);

let addPer      = (p1,p2) => _makePeriod(moment.duration(processPeriod(p1)).add(moment.duration(p2)));

// date / distance methods
export function orderMag(dop){ return floor(log( ( dop instanceof Date ) ? dop.getTime() : moment.duration({days: processPeriod(dop).total}).asMilliseconds() ) / LN10);}

export function orderMagValue(last,first){
	// end of cur year
	let nextfst = utc(new Date(first.getUTCFullYear() + 1,0,0));
	if(lowerThan(nextfst,last)){
		return nextfst;
	}

	// end of cur semester 
	if(first.getUTCMonth() < 7){
		nextfst = utc(new Date(first.getUTCFullYear(),7,0));
		if(lowerThan(nextfst,last)){
			return nextfst;
		}
	}

	// end of cur trimester
	let mm = first.getUTCMonth() + 3 - first.getUTCMonth() % 3;
	nextfst = utc(new Date(first.getUTCFullYear(),mm,0));
	if(lowerThan(nextfst,last)){
		return nextfst;
	}

	// end of cur month
	nextfst = utc(new Date(first.getUTCFullYear(),first.getUTCMonth() + 1,0));
	if(lowerThan(nextfst,last)){
		return nextfst;
	}

	// end of cur half-month
	if(first.getUTCDate() < 15){
		nextfst = utc(new Date(first.getUTCFullYear(),first.getUTCMonth(),14));
		if(lowerThan(nextfst,last)){
			return nextfst;
		}
	}

	// end of cur quarter-month (as 7 days)
	let dd = first.getUTCDate() + 7 - first.getUTCDate() % 7 - 1;
	nextfst = utc(new Date(first.getUTCFullYear(),first.getUTCMonth(),dd));
	if(lowerThan(nextfst,last)){
		return nextfst;
	}

	// next day
	return utc(new Date(first.getUTCFullYear(),first.getUTCMonth(),first.getUTCDate() + 1));
}

export function orderMagDist(r){ return _makePeriod(pow(10,orderMag(r)));}

export function roundUp(p){ return roundPeriod(p,'up');}

export function roundDown(p){ return roundPeriod(p,'down');}

//m.multiply     = (p,f) => _makePeriod(moment.duration({days: processPeriod(p).total * f}));
export function multiply(p,f){
	let sp = {};
	for(let u in p){
		if(u === 'offset'){
			continue;
		}
		sp[u] = p[u] * f;
	}
	return processPeriod(sp);
}

//m.divide       = (p,f) => _makePeriod(moment.duration({days: processPeriod(p).total / f}));
export function divide(p,f){
	let np = multiply(p,1/f);
	return _makePeriod(moment.duration({days: np.total}));
}

export function increase(p1,p2){ return _makePeriod(moment.duration({days: processPeriod(p1).total + processPeriod(p2).total}));}

export function offset(p){
	let sp = processPeriod(p);

	let offsetMe = (per) => {
		if(per.years !== 0){
			return _makePeriod(moment.duration({months: -6}));
		}else{
			return divide(p, -2);
		}
	};

	return sp.offset ? offsetMe(sp) : _makePeriod(0) ;
}

// date methods
export function closestRoundUp(ref,per){ return closestUp(ref, roundPeriod(per) );}

export function closestRoundDown(ref,per){ return closestDown(ref, roundPeriod(per) );}

export function closestRound(ref,om,type){ return type === 'up' ? closestRoundUp(ref,om) : closestRoundDown(ref,om);}

export function min(dates){ 
	if(dates.length < 50001){
		return utc(new Date(Math.min.apply(null, map(dates, (date) => date.getTime() ))));
	}else{
		let m = dates[0];
		for(let i = 1; i < dates.length; i++){
			m = m.getTime() > dates[i].getTime() ? dates[i] : m ;
		}
		return utc(m);
	}
}

export function max(dates){ 
	if(dates.length < 50001){
		return utc(new Date(Math.max.apply(null, map(dates, (date) => date.getTime()))));
	}else{
		let m = dates[0];
		for(let i = 1; i < dates.length; i++){
			m = m.getTime() < dates[i].getTime() ? dates[i] : m ;
		}
		return utc(m);
	}
}

export function label(date,period){
	let format = fetchFormat(period);
	let out = '';
	if(format.pref === 'S'){
		out = (date.getUTCMonth() > 5)? '2/' : '1/';
		out += moment.utc(date).format('YY');
	}else{
		out = moment.utc(date).format(format.string);
	}
	return format.pref + out;
}

let addMonth = (d,m) => moment.utc(d).add(1,'days').add(m, 'months').add(-1,'days').toDate();

// deal with periods >= months
// to have last day of month stay last day of month
let addDate = (d,p) => {
	let { years, months } = p;

	// more precision than necessary
	const e = p.days - Math.trunc(p.days);
	const h = e * 24;
	p.hours = Math.trunc(h);
	p.minutes = (p.hours - Math.trunc(p.hours)) * 60;

	return moment.utc(addMonth(d, 12 * years + months))
		.add(p.weeks,'weeks')
		.add(p.days,'days')
		.add(p.hours,'hours')
		.add(p.minutes,'minutes').toDate();
};

// date & period methods
export function add(dop,p){
	// preprocess period
	let sp = processPeriod(p);

	return dop instanceof Date ? addDate(dop,sp) : addPer(dop,sp);
}

export function subtract(dop,p){
	// preprocess period
	let sp = {};
	for(let u in p){
		sp[u] = p[u];
	}
	sp = processPeriod(sp, -1);
	return add(dop,sp);

}

export function distance(d1,d2){ return _makePeriod(abs(d1.getTime() - d2.getTime()));}

export function greaterThan(dop1,dop2){
	let sd = sameDoP(dop1,dop2);
	if(sd === null){
		throw new Error('Error in dateMgr: trying to compare a Date with a Period');
	}
	return _greaterThan(dop1,dop2,sd);
}

export function lowerThan(dop1,dop2){
	let sd = sameDoP(dop1,dop2);
	if(sd === null){
		throw new Error('Error in dateMgr: trying to compare a Date with a Period');
	}
	return _lowerThan(dop1,dop2,sd);
}

export function equal(dop1,dop2){
	let sd = sameDoP(dop1,dop2);
	if(sd === null){
		throw new Error('Error in dateMgr: trying to compare a Date with a Period');
	}
	return _equal(dop1,dop2,sd);
}

// managements
export function getValue(dop){ return (dop instanceof Date) ? dop.getTime() : moment.duration(dop).asMilliseconds();}

export function extraTicks(step,start,end, already){
	let out = [];
	let startYear = start.getUTCFullYear();
	let lastYear = end.getUTCFullYear();
	// every year, whatever happens
	for(let ye = startYear; ye <= lastYear; ye++){
		let dat = utc(new Date(ye,0,0));
		let idx = findIndex(already,(a) => equal(a.position,dat));
		if(idx !== -1){
			already[idx].grid = {};
			already[idx].grid.show = true;
			continue;
		}
		if(lowerThan(start,dat) && lowerThan(dat,end)){
			out.push({
				type: 'major',
				position: dat,
				offset: {
					along: 0,
					perp: 0
				},
				label: '',
				show: false,
				extra: true,
				grid: {
					show: true,
					color: 'LightGray',
					width: 0.5
				}
			});
		}
	}
	return out;
}

export function smallestStep(){ return _makePeriod(moment.duration({days: 1}));}

export function makePeriod(per){ return processPeriod(per);}

// in years
export function value(num,period){ return period ? moment.duration(num) : utc(new Date(num * 1000 * 3600 * 24 * 365));}

// in years
export function step(num){ return _makePeriod({years: num});}

export function isValidStep(cand){
	if(!cand){
		return false;
	}
	
	for(let u in _period){
		if(cand[u]){
			return true;
		}
	}
	return false;
}

// no preference
export function betterStep(a,b){return b;}

// no
export function labelize(){ return false;}

//
export function defaultSpan(){ return _makePeriod(moment.duration({months: 6}));}

export const labelF = 0.75;

export function isZero(dOp){ return dOp instanceof Date ? dOp.getTime() === 0 : dOp.total === 0;}

export function emptyBounds(){
  return { 
    min: moment.utc('1983-09-04').toDate(),
    max: moment.utc('1987-09-04').toDate()
  };
}

export const type = 'date';
