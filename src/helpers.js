import { process, defaultTheProps } from './core/process.js';
import { freeze } from './core/im-utils.js';
import { deepCp, isNil } from './core/utils.js';
import { toC } from './core/space-transf.js';
import * as manip from './core/data-manip.js';

const letters = 'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN';
const rnd = () => letters.charAt(Math.floor(Math.random() * letters.length));

export function init(rawProps,type){

	let props;
	let freezer;

	let updatee = {};

	// super quick, should not be needed to be strong
	const genKey = () => {
		let key = rnd() + rnd();
		while(!isNil(updatee[key])){
			key = rnd() + rnd();
		}
		return key;
	};

	const updateDeps = () => {
		for(let i in updatee){
			if(updatee[i].forceUpdate){
				updatee[i].forceUpdate();
			}else{
				delete updatee[i];
			}
		}
	};

	let rc = {};
	//
	props = defaultTheProps(deepCp({},rawProps));
	props.freeze = type;
	freezer = freeze(process(() => freezer.get(), props, () => rc));
	freezer.on('update',updateDeps);

	rc.defaults = (p) => defaultTheProps(p || props);

	rc.props = rc.get = () => freezer.get();
	rc.unprocessedProps = () => props;

	rc.legend = () => freezer.get().legend;

	rc.mgr = () => freezer;

	rc.toC = (point) => {
		return {
			x: toC(point.ds.x,point.position.x),
			y: toC(point.ds.y,point.position.y)
		};
	};

  rc.__preprocessed = true;

  rc.updateGraph = (obj, key) => {
		if(isNil(key)){
			key = genKey();
		}
		if(!updatee[key]){
			updatee[key] = obj;
		}

    updateDeps();
		return key;
	};

	rc.reinit = (newProps, type) => {
		newProps = newProps || props;
		props   = defaultTheProps(deepCp({},newProps));
		props.freeze = type;
		freezer = freeze(process(() => freezer.get(), props));
		freezer.on('update', updateDeps);
		updateDeps();
	};

	rc.delCurve = (idx) => manip.remove(idx, { props, mgr: rc });
	rc.addCurve = (data, graphp) => manip.add({data,graphp}, {props, mgr: rc});

	rc.dynamic = {
		remove: {
			curve: rc.delCurve,
			mark: (cidx,midx) => manip.removeMark(cidx, midx, {props, mgr: rc})
		},
		add: {
			curve: rc.addCurve,
			mark: (cidx,midx, position) => manip.removeMark(cidx, midx, position,  {props, mgr: rc})
		},
		toggle: {
			curve: (idx) => manip.toggle(idx, { props, mgr: rc}),
			mark:  (cidx,midx) => manip.toggleMark(cidx, midx, {props, mgr: rc}) 
		},
		hide: {
			curve: (idx) => manip.hide(idx, { props, mgr: rc}),
			mark:  (cidx,midx) => manip.hideMark(cidx, midx, {props, mgr: rc}) 
		},
		show: {
			curve: (idx) => manip.show(idx, { props, mgr: rc}),
			mark:  (cidx,midx) => manip.showMark(cidx, midx, {props, mgr: rc}) 
		}
	};

	return rc;

}
