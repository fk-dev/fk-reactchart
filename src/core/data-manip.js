export function remove(idx, { props, mgr }){
	// raw
	props.data.splice(idx,1);
	props.graphProps.splice(idx,1);
	// freezer
	mgr.reinit(props);
}

export function hide(idx, { props, mgr }){
	// raw
	let val = !props.graphProps[idx].show;
	props.graphProps[idx].show = val;
	// freezer
	mgr.get().curves[idx].set('show',val);
}

export function add( { data, graphp} , {props, mgr }){
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
	mgr.get().curves[cidx].mark.splice(midx,1);
}

export function addMark(cidx, midx, position, {props, mgr }){
	console.log('not yet');
	return;
	//raw
	props.data[cidx].series.splice(midx,1);
	// freezer
	mgr.get().curves[cidx].mark.splice(midx,1);
}

export function hideMark(cidx, midx, { props, mgr } ){
	let val = !props.data[cidx].series[midx].show;
	//raw
	props.data[cidx].series[midx].show = val;
	// mgr
	mgr.get().curves[cidx].marks[midx].mark.set('show',val);
}
