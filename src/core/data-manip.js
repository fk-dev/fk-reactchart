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
