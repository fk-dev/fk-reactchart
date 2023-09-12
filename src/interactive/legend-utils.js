import { mgr } from '../svg/core/utils.js';

const filterDateEvents = {
	"1M":{
		onClick: 'filterOneMonth',
		label:'1m'
	},
	"3M":{
		onClick: 'filterThreeMonths',
		label:'3m'
	},
	"6M":{
		onClick: 'filterSixMonths',
		label:'6m'
	},
	"YTD":{
		onClick: 'filterYTD',
		label:'ytd'
	},
	"1Y": {
		onClick: 'filterOneYear',
		label:'1y'
	},
	"3Y":{
		onClick: 'filterThreeYears',
		label:'3y'
	},
	"5Y":{
		onClick: 'filterFiveYears',
		label:'5y'
	},
	"ALL":{
		onClick:'filterAll',
		label:'Tout'
	},
	'from':{
		onChange:'from',
	},
	'to':{
		onChange:'to'
	}
};

const dateIntervalValues = {

	"1M":  { months: 1}, 
	"3M":  { months: 3}, 
	"6M":  { months: 6}, 
	"YTD": { years: 1}, 
	"1Y":  { years: 1}, 
	"3Y":  { years: 3}, 
	"5Y":  { years: 5},
	"ALL": true

};

function fromDate(key){
	return dateIntervalValues[key];
}

function fromNbr(key){

	return Number(key);

}

function endOfYear(date){
	return new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
}

function intervalFrom(key,type){

	return type === 'date' ? fromDate(key) : fromNbr(key);

}

function valueTo(key,originalValue){

	return key === 'YTD' ? endOfYear(originalValue) : originalValue;

}

export function makeInterval(key,{absoluteFrom, absoluteTo}){

	const { greaterThan, equal, subtract, type } = mgr(absoluteFrom);

	const value = intervalFrom(key,type);

	const from = value === true ? absoluteFrom : subtract(valueTo(key,absoluteTo),value);

	const to = absoluteTo;

	const isActive = value && ( greaterThan(from,absoluteFrom) || equal(from,absoluteFrom) );

	return { from, to ,isActive };

}

export function isValid({value, absoluteFrom, absoluteTo}){

	const { greaterThan, equal, lowerThan } = mgr(absoluteFrom);

	return ( greaterThan(value,absoluteFrom) || equal(value,absoluteFrom) ) && ( lowerThan(value,absoluteTo) || equal(value,absoluteTo) );
	
}
