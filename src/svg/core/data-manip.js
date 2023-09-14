import { deepCp } from "./utils.js";
//// hide/show
const setShowValue = (idx, val, { props, mgr }) => {

	// last curve cannot disappear
	if(!val && props.graphProps.reduce( (memo,v,i) => i !== idx ? memo || v.show : memo, false) === false){
		return false;
	}
	// raw
	props.graphProps[idx].show = val;
	// freezer
	mgr.manipAllVMs( vm => vm().curves[idx].set('show',val) );

	return true;
};

const setShowMarkValue = (cidx, midx, val, { props, mgr } ) => {
	//raw
	props.data[cidx].series[midx].show = val;
	// mgr
	mgr.manipAllVMs( vm => vm().curves[cidx].marks[midx].mark.set('show',val));
};

export function toggle(idx, { props, mgr }){
	// raw
	const val = !props.graphProps[idx].show;
	const update = setShowValue(idx, val, { props, mgr });
	if(!update){
		return {update, val: !val};
	}
	mgr.reinit(props);
	return {update, val};
}

export function hide(idx, { props, mgr }){
	setShowValue(idx, false, { props, mgr });
}

export function show(idx, { props, mgr }){
	setShowValue(idx, true, { props, mgr });
}

export function toggleMark(cidx, midx, { props, mgr } ){
	let val = !props.data[cidx].series[midx].show;
	setShowMarkValue(cidx, midx, val, { props, mgr });
	return val;
}

export function hideMark(cidx, midx, { props, mgr } ){
	setShowMarkValue(cidx, midx, false, { props, mgr });
}

export function showMark(cidx, midx, { props, mgr } ){
	setShowMarkValue(cidx, midx, true, { props, mgr });
}

/// del/add

export function remove(idx, { props, mgr }){
	// raw
	// console.log("calling remove with:"+JSON.stringify({idx,mgr}));
	props.data.splice(idx,1);
	props.graphProps.splice(idx,1);
	// freezer
	mgr.reinit(props);
}

export function add( { data, graphp } , {props, mgr }){
	// raw
	props.data.push(data);
	props.graphProps.push(graphp);
	// freezer
	mgr.reinit(props);
}

export function removeMark(cidx, midx, {props, mgr }){
	//raw
	props.data[cidx].series.splice(midx,1);
	// freezer
	mgr.manipAllVMs(vm => vm().curves[cidx].mark.splice(midx,1));
}

export function addMark(cidx, midx, position, {props, mgr }){
	console.log('not yet');
	return;
	//raw
	props.data[cidx].series.splice(midx,1);
	// freezer
	mgr.manipAllVMs(vm => vm().curves[cidx].mark.splice(midx,1));
}

export function filter({from,to},{props,mgr}){
	// console.log("calling filter with args:"+JSON.stringify({from,to,props,mgr}));

	const getDs = mgr => {
		const cu = mgr.props().curves.find(x => x.path?.ds ?? x.marks?.[0]?.ds);
		return cu.path?.ds ?? cu.marks?.[0]?.ds;
	};

	if(!props.originalDs){
		props.originalDs = deepCp({},getDs(mgr));
	}
	props.data.forEach(data =>{
		if(!data.originalSeries){
			data.originalSeries = deepCp([],data.series);
		}
		if(!from && !to){
			data.series = data.originalSeries;
			
		}else{
			//filter using from,to
			// console.log("final filter using :"+JSON.stringify({from,to,series:data.originalSeries}));
			data.series.dateFilter = data.series.dateFilter || {from,to};
			let filterSeries = data.series;
			// console.log("filters:"+JSON.stringify({from,to,dateFilters:data.series.dateFilter}));
			if((from && from<data.series.dateFilter.from) || (to && to>data.series.dateFilter.to)){
				filterSeries = deepCp([],data.originalSeries);
			}
			if(!from && data.series.dateFilter.from){from = data.series.dateFilter.from;}
			if(!to && data.series.dateFilter.to){to = data.series.dateFilter.to;}
			let newSerie = [];
			for (let i = filterSeries.length-1; i>= 0; i--) {
				const point = filterSeries[i];
				if (to && point.x > to) { continue; }
				newSerie.push(point);
				if (from && point.x <= from) { break; }	//je m'arrête après
			}
			data.series = newSerie.reverse();
			// data.series = filterSeries.filter(point => {
			// 	let satFrom = true;
			// 	let satTo = true;
			// 	if(from){
			// 		satFrom = point.x >= from;
			// 	}
			// 	if(to){
			// 		satTo = point.x <= to;
			// 	}
			// 	return satFrom && satTo;
			// });
			data.series.dateFilter = {from,to};
		}
	
		if(data.rebaseType){
			// console.log("will rebase");
			//rebase after filter
			let serieStartDate = Math.min(...data.series.map(p=>p.x));
			let serieStartValue = data.series.find(p=>p.x.getTime() === serieStartDate)?.y;
			data.series.forEach(point=>{
				if(data.rebaseType === 'base100'){
					point.y = point.y * 100 / serieStartValue;
				}else if(data.rebaseType === 'base0'){
					point.y = 100 * (point.y - serieStartValue)/serieStartValue;
				}
			});
		}
		// data.series = data.series.slice(0,100);
	});
	mgr.reinit(props);
}
