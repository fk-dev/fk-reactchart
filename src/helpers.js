import { process, defaultTheProps, processLegend } from './core/process.js';
import { freeze } from './core/im-utils.js';
import { deepCp, isNil, measure, rndKey } from './core/utils.js';
import { toC } from './core/space-transf.js';
import * as manip from './core/data-manip.js';

export function init(rawProps, type, Obj, debug){

	Obj = Obj || {};
	let { key, obj, namespace } = Obj;

	let hasDebug = debug;
	let props;
	let freezer = {get: () => null};
	let graphKey = key;
	const _process  = type === 'legend' ? processLegend : process;

	let updatee = {};

	namespace = namespace || 'reactchart';

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

	let measurer = measure(graphKey, debug);

	// raw props
	props = defaultTheProps(deepCp({},rawProps));
	props.freeze = type;

	// lengthes
		// to have a cadratin for every places (labels)
	rc.lengthes = () => measurer.cadratin(rc.unprocessedProps(),rc.graphKey());
		// measurer
	rc.measureText = (t,f,cn) => measurer.text(t,f,cn);
		// usable?
	rc.canMeasure = () => measurer.active;
		// reset
	rc.setMeasurer = () => {
		measurer = measure(rc.graphKey(), debug);
	};
	rc.hasDebug = () => hasDebug;
	rc.setDebug = dbg => measurer.setDebug(dbg);

	// id
		// getter
	rc.graphKey = () => graphKey;
		// setter
	rc.setKey = (key,obj) => {
		graphKey = key;
		rc.setMeasurer();
		if(obj){
			updatee[key] = obj;
		}
	};

	// update Graph (obj)
	if(obj){
		updatee[rc.graphKey()] = obj;
	}

	// self id, if ever same Graph changes helpers
	rc.__mgrId = `${rndKey()}${rndKey()}`;

	// getters
	rc.props   = rc.get = () => freezer.get();
	rc.unprocessedProps = () => props;
	rc.legend           = () => type === 'legend' ? freezer.get() : freezer.get().legend;
	rc.mgr              = () => freezer;

	// utils
	rc.defaults = (p) => defaultTheProps(p || props);

	rc.toC = (point) => {
		return {
			x: toC(point.ds.x,point.position.x),
			y: toC(point.ds.y,point.position.y)
		};
	};

  rc.updateGraph = (obj, key) => {
		if(isNil(key)){
			return;
		}else if(rc.graphKey() !== key){
			rc.setKey(key);
		}

		if(!updatee[key]){
			updatee[key] = obj;
		}

    updateDeps();
		return key;
	};

	rc.setNamespace = (ns,up) => {
		if(ns && namespace !== ns){
			namespace = ns;
			if(up !== false){
				updateDeps();
			}
		}
	};

	rc.getNamespace = () => namespace;

	rc.reinit = (newProps, type) => {
		// check measurer
		if(!rc.canMeasure()){
			rc.setMeasurer();
		}
		newProps = newProps || props;
		props   = defaultTheProps(deepCp({},newProps));
		props.freeze = type;
		freezer = freeze(_process(() => freezer.get(), props, () => rc));
		freezer.on('update', updateDeps);
		updateDeps();
	};

	rc.kill = key => {
		delete updatee[key];
	};

	// dyn graph
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

	// finalize
  rc.__preprocessed = true;

	// processed props
	freezer = freeze(_process(() => freezer.get(), props, () => rc));
	freezer.on('update',updateDeps); // last

	return rc;

}
