let moment = require('moment');
let _ = require('underscore');
let im = {
	isImm: p => typeof p === 'object' ? Object.isFrozen(p) : false
};

let { pow, floor, log, min, max, abs, LN10 } = Math;

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
		period = makePeriod(moment.duration(per));
	}

	for(let t in _period){
		if(per[t] === null || per[t] === undefined){
			period[t] = 0;
		}else{
			period[t] = per[t] * fac;
		}
	}

	period.total = per.total === null || per.total === undefined ? moment.duration(period).asDays() * fac : per.total;

  period.offset = per.offset;

	if(period.total > 15 && ( period.offset === null || period.offset === undefined ) ){
		period.offset = true;
	}

	return period;
};

let makePeriod = function(msOrDur){
	let dur = msOrDur.years && typeof msOrDur.years === 'function' ? msOrDur : moment.duration(msOrDur);
	return {
		years:  dur.years(),
		months: dur.months(),
		weeks:  dur.weeks(),
		days:   dur.days() - 7 * dur.weeks(),
		total:  dur.asDays(),
		offset: dur.asDays() > 15
	};
};

let fetchFormat = function(p){
	p = processPeriod(p);
	if(p.years !== 0){
		return {
			string: 'YYYY',
			pref: ''
		};
	}else if(p.months >= 6){
		return {
			string: 'S/YY', // ce format n'existe pas, il est géré par la fonction qui appelle
			pref: 'S'
		};
	}else if(p.months >= 3){
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

let roundDownPeriod = function(p){

	let make = (lab,val) => {
		return {
			label: lab,
			val: val
		};
	};

	let out = {};
	if(p.years > 2){
		out = make('years',max(floor(p.years)/10,1));
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

let roundUpPeriod = function(p){

	let make = (lab,val) => {
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
let roundPeriod = function(per,type){

	// copy
	let p = makePeriod(per);

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
	let round = ( type === 'up' ) ? roundUpPeriod(p) : roundDownPeriod(p);
	makeThis(round.label,round.val);

	p.total = moment.duration(p).asDays();

	return p;
};

let closestUp = function(date,per){
	let out = closestDown(date,per);
	while(out.getTime() <= date.getTime()){
		out = m.add(out,per);
	}

	return out;
};

// beginning of period
let closestDown = function(date,per){
	// day
	if(per.days !== 0){
		return moment(date).subtract(per.days,'days').startOf('day').toDate();
	}
	// start of week: Sunday
	if(per.weeks !== 0){
		return moment(date).subtract(per.weeks,'weeks').startOf("week").toDate();
	}
	// start of month
	if(per.months !== 0){
		let month = 0;
		while(month < date.getMonth()){
			month += per.months;
		}
		month -= per.months;
		return utc(new Date(date.getFullYear(),month,1));
	}
	// start of year
	if(per.years !== 0){
		return utc(new Date(date.getFullYear(),0,1));
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

let greaterThan = (v1,v2,type) => type === 'date' ? dateGT(v1,v2) : periodGT(v1,v2);

let lowerThan   = (v1,v2,type) => type === 'date' ? dateLT(v1,v2) : periodLT(v1,v2);

let equal       = (v1,v2,type) => type === 'date' ? dateEQ(v1,v2) : periodEQ(v1,v2);

let addPer      = (p1,p2) => makePeriod(moment.duration(processPeriod(p1)).add(moment.duration(p2)));

let m = {};

// date / distance methods
m.orderMag = (dop) => floor(log( ( dop instanceof Date ) ? dop.getTime() : moment.duration({days: processPeriod(dop).total}).asMilliseconds() ) / LN10);

m.orderMagValue = function(last,first){
	// end of cur year
	let nextfst = utc(new Date(first.getFullYear() + 1,0,0));
	if(m.lowerThan(nextfst,last)){
		return nextfst;
	}

	// end of cur semester 
	if(first.getMonth() < 7){
		nextfst = utc(new Date(first.getFullYear(),7,0));
		if(m.lowerThan(nextfst,last)){
			return nextfst;
		}
	}

	// end of cur trimester
	let mm = first.getMonth() + 3 - first.getMonth() % 3;
	nextfst = utc(new Date(first.getFullYear(),mm,0));
	if(m.lowerThan(nextfst,last)){
		return nextfst;
	}

	// end of cur month
	nextfst = utc(new Date(first.getFullYear(),first.getMonth() + 1,0));
	if(m.lowerThan(nextfst,last)){
		return nextfst;
	}

	// end of cur half-month
	if(first.getDate() < 15){
		nextfst = utc(new Date(first.getFullYear(),first.getMonth(),14));
		if(m.lowerThan(nextfst,last)){
			return nextfst;
		}
	}

	// end of cur quarter-month (as 7 days)
	let dd = first.getDate() + 7 - first.getDate() % 7 - 1;
	nextfst = utc(new Date(first.getFullYear(),first.getMonth(),dd));
	if(m.lowerThan(nextfst,last)){
		return nextfst;
	}

	// next day
	return utc(new Date(first.getFullYear(),first.getMonth(),first.getDate() + 1));
};

m.orderMagDist = (r) => makePeriod(pow(10,m.orderMag(r)));

m.roundUp      = (p) => roundPeriod(p,'up');

m.roundDown    = (p) => roundPeriod(p,'down');

//m.multiply     = (p,f) => makePeriod(moment.duration({days: processPeriod(p).total * f}));
m.multiply     = (p,f) => {
	let sp = processPeriod(p);
	for(let u in p){
		if(u === 'offset'){
			continue;
		}
		sp[u] *= f;
	}
	return sp;
};

//m.divide       = (p,f) => makePeriod(moment.duration({days: processPeriod(p).total / f}));
m.divide = (p,f) => {
	let np = m.multiply(p,1/f);
	return makePeriod(moment.duration({days: np.total}));
};

m.increase = (p1,p2) => makePeriod(moment.duration({days: processPeriod(p1).total + processPeriod(p2).total}));

m.offset = function(p){
	let sp = processPeriod(p);

	let offsetMe = (per) => {
		if(per.years !== 0){
			return makePeriod(moment.duration({months: -6}));
		}else{
			return m.divide(p, -2);
		}
	};

	return sp.offset ? offsetMe(sp) : makePeriod(0) ;
};

// date methods
m.closestRoundUp   = (ref,per) => closestUp(ref, roundPeriod(per) );

m.closestRoundDown = (ref,per) => closestDown(ref, roundPeriod(per) );

m.closestRound     = (ref,om,type) => type === 'up' ? m.closestRoundUp(ref,om) : m.closestRoundDown(ref,om);

m.min              = (dates) => utc(new Date(min.apply(null,_.map(dates, (date) => date.getTime() ))));

m.max              = (dates) => utc(new Date(max.apply(null,_.map(dates, (date) => date.getTime()))));

m.label = function(date,period){
	let format = fetchFormat(period);
	let out = '';
	if(format.pref === 'S'){
		out = (date.getMonth() > 5)? '2/' : '1/';
		out += moment(date).format('YY');
	}else{
		out = moment(date).format(format.string);
	}
	return format.pref + out;
};

let addMonth = (d,m) => moment(d).add(1,'days').add(m, 'months').add(-1,'days').toDate();

// deal with periods >= months
// to have last day of month stay last day of month
let addDate = (d,p) => {
	let { years, months } = p;

	return moment(addMonth(d, 12 * years + months))
		.add(p.weeks,'weeks')
		.add(p.days,'days').toDate();
};

// date & period methods
m.add = function(dop,p){
	// preprocess period
	let sp = processPeriod(p);

	return dop instanceof Date ? addDate(dop,sp) : addPer(dop,sp);
};

m.subtract = function(dop,p){
	// preprocess period
	let sp = {};
	for(let u in p){
		sp[u] = p[u];
	}
	sp = processPeriod(sp, -1);
	return m.add(dop,sp);

};

m.distance = (d1,d2) => makePeriod(abs(d1.getTime() - d2.getTime()));

m.greaterThan = function(dop1,dop2){
	let sd = sameDoP(dop1,dop2);
	if(sd === null){
		throw new Error('Error in dateMgr: trying to compare a Date with a Period');
	}
	return greaterThan(dop1,dop2,sd);
};

m.lowerThan = function(dop1,dop2){
	let sd = sameDoP(dop1,dop2);
	if(sd === null){
		throw new Error('Error in dateMgr: trying to compare a Date with a Period');
	}
	return lowerThan(dop1,dop2,sd);
};

m.equal = function(dop1,dop2){
	let sd = sameDoP(dop1,dop2);
	if(sd === null){
		throw new Error('Error in dateMgr: trying to compare a Date with a Period');
	}
	return equal(dop1,dop2,sd);
};

// managements
m.getValue = (dop) => (dop instanceof Date) ? dop.getTime() : moment.duration(dop).asMilliseconds();

m.extraTicks = function(step,start,end, already){
	let out = [];
	let startYear = start.getFullYear();
	let lastYear = end.getFullYear();
	// every year, whatever happens
	for(let ye = startYear; ye <= lastYear; ye++){
		let dat = utc(new Date(ye,0,0));
		let idx = _.findIndex(already,(a) => m.equal(a.position,dat));
		if(idx !== -1){
			already[idx].grid = {};
			already[idx].grid.show = true;
			continue;
		}
		if(m.lowerThan(start,dat) && m.lowerThan(dat,end)){
			out.push({
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
};

m.smallestStep = () => makePeriod(moment.duration({days: 1}));

m.makePeriod   = (per) => processPeriod(per);

// in years
m.value        = (num) => utc(new Date(num * 1000 * 3600 * 24 * 365));

// in years
m.step         = (num) => makePeriod({years: num});

m.isValidStep  = (cand) => {
	if(!cand){
		return false;
	}
	
	for(let u in _period){
		if(cand[u]){
			return true;
		}
	}
	return false;
};

// no
m.labelize     = () => false;

//
m.defaultSpan  = () => makePeriod(moment.duration({months: 6}));

m.labelF = 0.75;

m.isZero = (dOp) => dOp instanceof Date ? dOp.getTime() === 0 : dOp.total === 0;

m.type = 'date';

module.exports = m;
