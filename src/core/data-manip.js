import { bson } from "fk-helpers";
//// hide/show
const setShowValue = (idx, val, { props, mgr }) => {
	// raw
	props.graphProps[idx].show = val;
	// freezer
	mgr.manipAllVMs( vm => vm().curves[idx].set('show',val) );
};

const setShowMarkValue = (cidx, midx, val, { props, mgr } ) => {
	//raw
	props.data[cidx].series[midx].show = val;
	// mgr
	mgr.manipAllVMs( vm => vm().curves[cidx].marks[midx].mark.set('show',val));
};

export function toggle(idx, { props, mgr }){
	// raw
	let val = !props.graphProps[idx].show;
	setShowValue(idx, val, { props, mgr });
	mgr.reinit(props);
	return val;
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
	props.data.forEach(data =>{
		if(!data.originalSeries){
			data.originalSeries = bson.clone(data.series);
		}
		if(!from && !to){
			data.series = data.originalSeries;
			
		}else{
			//filter using from,to
			// console.log("final filter using :"+JSON.stringify({from,to,series:data.originalSeries}));
			data.series = data.originalSeries.filter(point => {
				let satFrom = true;
				let satTo = true;
				if(from){
					satFrom = point.x >= from;
				}
				if(to){
					satTo = point.x <= to;
				}
				return satFrom && satTo;
			});
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
					point.y = (point.y - serieStartValue)/serieStartValue;
				}
			});
		}
		// data.series = data.series.slice(0,100);
	});
	mgr.reinit(props);
}