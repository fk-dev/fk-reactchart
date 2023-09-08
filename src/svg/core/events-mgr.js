import {date as hDate} from 'fk-helpers';

const clickers = {
	fade: (mgr,lId, idx) => {
		const faded = !mgr.props(lId).curves[idx].show;
		// curve
		const { update /*, val */} = mgr.dynamic.toggle.curve(idx);
		if(!update){
			return;
		}

		// legend
		mgr.legend(lId)[idx].icon.props.set('faded', !faded);
	},

	del: (mgr, lId, idx) => {

		const value = !mgr.props(lId).curves[idx].show;

		// redefine
		mgr.unprocessedProps(lId).graphProps[idx].show = value;

		// legend
		mgr.legend(lId)[idx].icon.props.set('faded', !value);

		// recompute
		mgr.reinit(mgr.unprocessedProps(lId));
	},

	filter: (mgr,lId, {from,to}) => {
		mgr.dynamic.filter.curve({from,to});
	},
	filterOneMonth:(mgr,lId,idx) => {
		const curves = mgr.props(lId).curves;
		const maxDates = curves.reduce((acc,curr)=>{
			let dates = getPositions(curr).map(p=>p.x);
			acc.push(Math.max(...dates));
			return acc;
		},[]);
		const to = new Date(Math.min(...maxDates));
		const from =  hDate.addMonths(to, -1);
		mgr.dynamic.filter.curve({from,to});
	},
	filterThreeMonths: (mgr,lId,idx) => {
		const curves = mgr.props(lId).curves;
		const maxDates = curves.reduce((acc,curr)=>{
			let dates = getPositions(curr).map(p=>p.x);
			acc.push(Math.max(...dates));
			return acc;
		},[]);
		const to = new Date(Math.min(...maxDates));
		const from =  hDate.addMonths(to, -3);
		mgr.dynamic.filter.curve({from,to});
	},
	filterSixMonths: (mgr,lId,idx) => {
		const curves = mgr.props(lId).curves;
		const maxDates = curves.reduce((acc,curr)=>{
			let dates = getPositions(curr).map(p=>p.x);
			acc.push(Math.max(...dates));
			return acc;
		},[]);
		const to = new Date(Math.min(...maxDates));
		const from =  hDate.addMonths(to, -6);
		mgr.dynamic.filter.curve({from,to});
	},
	filterYTD:(mgr,lId,idx) => {
		const curves = mgr.props(lId).curves;
		const maxDates = curves.reduce((acc,curr)=>{
			let dates = getPositions(curr).map(p=>p.x);
			acc.push(Math.max(...dates));
			return acc;
		},[]);
		const to = new Date(Math.min(...maxDates));
		const from =  hDate.addYears(hDate.eoy(to), -1);
		mgr.dynamic.filter.curve({from,to});
	},
	filterOneYear: (mgr,lId,idx) => {
		const curves = mgr.props(lId).curves;
		const maxDates = curves.reduce((acc,curr)=>{
			let dates = getPositions(curr).map(p=>p.x);
			acc.push(Math.max(...dates));
			return acc;
		},[]);
		const to = new Date(Math.min(...maxDates));
		const from =  hDate.addYears(to, -1);
		mgr.dynamic.filter.curve({from,to});
	},
	filterThreeYears: (mgr,lId,idx) => {
		const curves = mgr.props(lId).curves;
		const maxDates = curves.reduce((acc,curr)=>{
			let dates = getPositions(curr).map(p=>p.x);
			acc.push(Math.max(...dates));
			return acc;
		},[]);
		const to = new Date(Math.min(...maxDates));
		const from =  hDate.addYears(to, -3);
		mgr.dynamic.filter.curve({from,to});
	},
	filterFiveYears: (mgr,lId,idx) => {
		const curves = mgr.props(lId).curves;
		const maxDates = curves.reduce((acc,curr)=>{
			let dates = getPositions(curr).map(p=>p.x);
			acc.push(Math.max(...dates));
			return acc;
		},[]);
		const to = new Date(Math.min(...maxDates));
		const from =  hDate.addYears(to, -5);
		mgr.dynamic.filter.curve({from,to});
	},
	filterAll:(mgr,lId,idx) => {
		mgr.dynamic.filter.curve({from:null,to:null});
	},
	from:(mgr,lId,idx,dateStrFrom) => {
		const from = new Date(dateStrFrom);
		mgr.dynamic.filter.curve({from});
	},
	to:(mgr,lId,idx,dateStrTo) => {
		const to = new Date(dateStrTo);
		mgr.dynamic.filter.curve({to});
	}
};

export function create(types){

	const { onClick,onChange } = types;

	let rc = {};

	rc.onClick = (idx) => onClick ? (mgr,lId) => clickers[onClick](mgr,lId,idx) : () => null;
	rc.onChange =  (idx)=> onChange ? (mgr,lId,chgEvent) => {
		let value = chgEvent.target.value;
		clickers[onChange](mgr,lId,idx,value);
	}:()=>null;
	rc.hasClick = onClick;
	rc.hasChange = onChange;

	return rc;

}
const getPositions = (curve)=>{
	if(curve.type === 'Plain'){
		return curve.path.positions;
	}else if(curve.type === 'Bars'){
		return curve.marks.map(m=>m.mark.position);
	}else{
		return null;
	}
};
