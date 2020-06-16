import { process, defaultTheProps, processLegend } from './core/process.js';
import { freeze } from './core/im-utils.js';
import { deepCp, isNil, measure, rndKey, emptyState, reinitOn } from './core/utils.js';
import { toC } from './core/space-transf.js';
import * as manip from './core/data-manip.js';
import { clear as clearGradient } from './core/gradient-mgr.js';

export function init(rawProps, type, Obj, debug){

	Obj = Obj || {};
	let { key, obj, namespace, onGraphDone, onGraphStart, printOnly, waitFor } = Obj;

	if(obj && !key){
		key = rndKey();
	}

	let hasDebug = debug;
	debug = debug || {log: () => null};
	let _atDone  = {};
	let _atStart = {};
	let props;
	let freezer = {
		_def: {
			get: () => emptyState
		}
	};

	const processALegend = (getNode, rawProps, mgrId, getMeasurer, cb) => processLegend(getNode,rawProps, mgrId, cb);
	const processAGraph  = (getNode, rawProps, mgrId, getMeasurer, cb) => process(getNode,rawProps, mgrId, getMeasurer, printOnly, cb);
	const _process  = type === 'legend' ? processALegend : processAGraph;

	let updatee = {};
	let updated = {};
	let keys = key ? [key] : [];
	let vms = {};
	let pointsTo = {};
	let invPointsTo = {};

	namespace = {
		_def: namespace || 'reactchart'
	};

	const onViewUpdate = (key,hk) => () => checkDone(key,hk);

	const allOutOfDate = () => {
		/// views
		for(let i in updated){
			updated[i] = false;
		}
		// hooks
		/// we keep the fct, we keep
		/// all the hookKeys for debugging purposes
		const hookKey = `h.${rndKey()}`;
		for(let k in _atDone){
			_atDone[k].done = 5;
			if(!_atDone[k].hookKeys){
				_atDone[k].hookKeys = {};
			}
			for(let hk in _atDone[k].hookKeys){
				_atDone[k].hookKeys[hk].done = 5;
			}
			_atDone[k].hookKeys[hookKey] = {done: -1};
		}
		for(let k in _atStart){
			_atStart[k]();
		}

		return hookKey;
	};

	const deleteKey = (k,ik) => {
		const _del = (arr) => {
			arr = arr || [];
			const i = arr.indexOf(k);
			if(i !== -1){
				arr.splice(i,1);
			}
		};


		// direct delete: updatee, updated, keys, pointsTo, invPointsTo, freezer
		_del(keys);
		delete updatee[k];
		delete updated[k];
		delete pointsTo[k];
		delete invPointsTo[k];
		delete freezer[k];
		// indirect: invPointsTo
		if(ik){
			_del(invPointsTo[ik]);
		}else{
			keys.forEach(key => _del(invPointsTo[key]));
		}
	};

	const isALegend = key => key.startsWith('l.') && keys.indexOf(key.substring(2)) !== -1;

	const updateDeps = (key,hk) => {

		const updateDef = () => {// look for 'em
			for(let u in pointsTo){
				if(pointsTo[u] === '_def'){
					if(updatee[u] && updatee[u].forceUpdate){
						updatee[u].forceUpdate();
						updated[u] = true;
					}
				}
			}
		};

		const _updateOne = (_key) => {

			if(_key === '_def'){
				return updateDef();
			}

			const invkey = pointsTo[_key];
			(invPointsTo[invkey] || []).forEach( k => {
				if(updatee[k] && updatee[k].forceUpdate){
					updatee[k].forceUpdate(onViewUpdate(k,hk));
					updated[k] = true;
					// legend ?
					if(updatee[`l.${k}`] && updatee[`l.${k}`].forceUpdate){
						updatee[`l.${k}`].forceUpdate();
					}
				}else if(updatee[k]){
					deleteKey(k,invkey);
				}
			});
		};

		if(key){
			_updateOne(key);
		}else{
			updateDef();
			keys.forEach( k => _updateOne(k));
		}

	};

	let rc = {};

	rc.graphKey = () => keys.length ? keys[0] : null;

	// raw props
	props = defaultTheProps(deepCp({},rawProps));
	props.freeze = type;

	// lengthes
	const getMeasurer = (key) => measurer[key] ? measurer[key].pointTo ? measurer[measurer[key].pointTo] : measurer[key] : measurer._def;
	rc.getLengthes = (key) => {
		return {
			// to have a cadratin for every places (labels)
			lengthes: () => getMeasurer(key).mgr.cadratin(rc.unprocessedProps()),
			// measurer
			measureText: (t,f,cn) => getMeasurer(key).mgr.text(t,f,cn)
		};
	};

		// usable?
	rc.canMeasure = () => {
		for(let k in measurer){
			if(k === '_def'){
				continue;
			}
			if(!getMeasurer(k).mgr.active){
				return false;
			}
		}
		return true;
	};

	const vmPointsTo = (k,p) => {
		if(k !== p && p !== '_def'){
			// all that points to k now points to p
			for(let u in pointsTo){
				if(pointsTo[u] === k){
					pointsTo[u] = p;
					invPointsTo[p].push(u);
				}
			}
			// k has no deps
			invPointsTo[k] = [];
		}
		// if someone had k (and is not p) in invPoints, delete
		for(let u in invPointsTo){
			if(u === p){
				continue;
			}
			const i = invPointsTo[u].indexOf(k);
			if(i !== -1){
				invPointsTo[u].splice(k,1);
			}
		}

	// now all is clear

		vms[k] = k === p;
		pointsTo[k] = p;
		if(k === p){
			invPointsTo[k] = [k];
		}else if(p !== '_def'){
			invPointsTo[p] = (invPointsTo[p] || []).concat(k);
		}
	};

	const initMeasurer = (meas,_key) => {

		const same = (a,b) => {

			const _same = (_a,_b) => _a.width === _b.width && _a.height === _b.height;

			const _axis = (_a,_b) => {
				// bottom, top, left, right
				for(let ax in _a){
					// label, factor || major, minor
					for(let ty in _a[ax]){
						if(!_same(_a[ax][ty],_b[ax][ty])){
							return false;
						}
					}
				}
				return true;
			};
			
			// title
			if(!_same(a.title,b.title)){
				return false;
			}
			// axis
			if(!_axis(a.axis,b.axis)){
				return false;
			}
			// ticks
			if(!_axis(a.ticks,b.ticks)){
				return false;
			}

			return true;
		};

		if(meas.active){
			const calibration = meas.calibrate(rc.unprocessedProps());
			for(let m in measurer){
				if(m === '_def'){
					continue;
				}
				if(pointsTo[m] === m && measurer[m].mgr.active && same(measurer[m].calibration, calibration)){
					vmPointsTo(_key,m);
					return {
						pointTo: m
					};
				}
			}
			vmPointsTo(_key,_key);
			return {
				calibration,
				mgr: meas
			};
		}else{
			const pointed = isALegend(_key) ? _key.substring(2) : '_def';
			vmPointsTo(_key,pointed);
			return {
				pointTo: pointed
			};
		}
	};


	const addAMeasurer = key => {
		// check for existence
		if(measurer[key] && measurer[key].mgr && measurer[key].mgr.active){
			return;
		}
		// 1 - get calibration data
		const tmpMeas = measure(key, debug);
		measurer[key] = initMeasurer(tmpMeas,key);
	};

	const initMeasurers = () => {
		for(let k in updatee){
			if(!getMeasurer(k)){
				addAMeasurer(k);
			}else{
				if(!getMeasurer(k).mgr.active){
					measurer[k] = initMeasurer(measure(k, debug),k);
				}
			}
		}
	};

		// reset
	rc.setMeasurer = (key) => key ? addAMeasurer(key) : initMeasurers();
	rc.hasDebug = () => hasDebug;
	rc.setDebug = (dbg,id) => {
		if(id && measurer[id] && measurer[id].mgr){
			measurer[id].mgr.setDebug(dbg);
		}else if(!id){
			for(let u in measurer){
				if(measurer[u].mgr){
					measurer[u].mgr.setDebug(dbg);
				}
			}
		}
	};

	const checkStart = k => {
		if(_atStart[k]){
			_atStart[k]();
		}
	};

	// two sources: vm || view
	// thus two passes
	// any value outside [-1,1]
	// is for debug
	// 5 -> outdated by reinit
	const hookToDo = hook => {
		const { done } = hook;
		if(done > -2 && done < 2){
			hook.done++;
			return hook.done === 1;
		}
		return false;
	};

	const checkDone = (k,hk) => {
		if(_atDone[k] && hookToDo(_atDone[k],k)){
			_atDone[k].fct();
		}else if(hk && _atDone[k] && _atDone[k].hookKeys && _atDone[k].hookKeys[hk] && hookToDo(_atDone[k].hookKeys[hk],k)){
			_atDone[k].fct();
		}
	};

	// id
		// getter
	rc.isUpdated = (key) => updated[key];
		// setter
	rc.addKey = (key,obj) => {
		// beware if already there
		if(keys.indexOf(key) === -1 && !isALegend(key)){
			keys.push(key);
		}else if(keys.indexOf(key) !== -1 && isALegend(key)){
			keys.splice(keys.indexOf(key),1);
		}

		rc.setMeasurer(key);

		const k = pointsTo[key];
		if(obj){
			updatee[key] = obj;
			updated[key] = false;
		}
		if(!freezer[k] && k !== '_def' && keys.indexOf(key) !== -1){
			_process(() => freezer[k].get(), props, rc.__mgrId, () => rc.getLengthes(k), (err, imVM) => {
				if(obj && obj.props.onSelect){
					imVM.outSelect = obj.props.onSelect;
				}
				if(obj && obj.props.onUnselect){
					imVM.outUnselect = obj.props.onUnselect;
				}
				freezer[k] = freeze(imVM);
				freezer[k].on('update',() => updateDeps(k)); // last
				if(obj){
					rc.updateGraph(obj, key);
				}
				checkDone(k);
			});
		}else if(obj){
			rc.updateGraph(obj, key);
		}

	};

	// self id, if ever same Graph changes helpers
	rc.__mgrId = `${rndKey()}${rndKey()}`;


		// because most of the time, no ambiguity
	const checkFreezer = () => {
		for(let u in freezer){
			if(u !== '_def'){
				return freezer[u];
			}
		}
		return freezer._def;
	};

	// getters
	const hasAKey       = (key) => key && pointsTo[key] && pointsTo[key] !== '_def' && freezer[pointsTo[key]];
	rc.mgr              = (key) => hasAKey(key) ? freezer[pointsTo[key]] : checkFreezer();
	rc.props   = rc.get = (key) => rc.mgr(key).get(); // processed props
	rc.unprocessedProps = () => props; // delfaulted unprocessed props
	rc.rawProps         = () => rawProps; // raw props
	rc.legend           = (key) => rc.props(key).legend;
	// vm manipulation
	rc.manipAVM         = (todo,key) => key ? freezer[key] ? todo(freezer[key].get,key) : null : todo(checkFreezer().get);
	rc.manipAllVMs      = (todo) => {
		for(let u in freezer){
			if(u === '_def'){
				continue;
			}
			todo(freezer[u].get,u);
		}
	};

	rc.onGraphStart = (key,fct) => {
		_atStart[key] = fct;
	};

	rc.onGraphDone = (key,fct) => {
		_atDone[key] = {
			done: -1,
			fct
		};
	};

	// utils
	rc.defaults = (p) => defaultTheProps(p || props);

	rc.toC = (point) => {
		return {
			x: toC(point.ds.x,point.position.x),
			y: toC(point.ds.y,point.position.y)
		};
	};

	// one graph update only
  rc.updateGraph = (obj, key) => {
		if(isNil(key)){
			return;
		}else if(keys.indexOf(key) === -1){
			return;
		}

    obj.forceUpdate(onViewUpdate(key));

		if(!updatee[key]){
			updatee[key] = obj;
		}

		updated[key] = true;

		// if has a legend
		if(updatee[`l.${key}`] && updatee[`l.${key}`].forceUpdate){
			updatee[`l.${key}`].forceUpdate();
		}

		return key;
	};

	rc.setNamespace = (ns,key) => {
		if(!ns){
			return;
		}
		if(key && namespace[key] !== ns){
			namespace[key] = ns;
			updateDeps(key);
		}else if(namespace._def !== ns){
			namespace._def = ns;
			updateDeps();
		}
	};

	rc.getNamespace = (key) => key && namespace[key] ? namespace[key] : namespace._def;

	const notUpToDate = () => {
		let out = [];
		for(let k in updated){
			if(!updated[k]){
				out.push(k);
			}
		}
		return out;
	};

	rc.reinit = (newProps, type) => {
		rawProps = newProps || rawProps;
		// check measurer
		if(!rc.canMeasure()){
			rc.setMeasurer();
		}
		const _props = newProps || props;
		clearGradient(rc.__mgrId,newProps ? null : notUpToDate());
		const hookKey = allOutOfDate();
		props   = _props.__defaulted ? _props : defaultTheProps(deepCp({},_props));
		props.freeze = type;
		keys.forEach( key => {
			if(vms[key] === '_def'){
				_process(() => freezer._def.get(), props, rc.__mgrId, () => rc.getLengthes('_def'), (err, imVM ) => {
					freezer._def = freeze(imVM);
					freezer._def.on('update', () => updateDeps('_def'));
				});
			}else if(vms[key]){
				_process(() => freezer[key].get(), props, rc.__mgrId, () => rc.getLengthes(key), (err,imVM) => {
					freezer[key] = freeze(imVM);
					freezer[key].on('update', () => updateDeps(key));
					updateDeps(key,hookKey);
					checkDone(key,hookKey);
				}); 
			}
		});
	};

	rc.kill = key => {
		const invkey = pointsTo[key];
		deleteKey(key,invkey);
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

	// building _def
		// measurer
	let measurer = {
		_def: {
			mgr: measure(null,debug)
		}
	};
		// freezer
	let _ready = false;
	if(key && onGraphStart ){
		rc.onGraphStart(key,onGraphStart);
		checkStart(key);
	}
	_process(() => freezer._def.get(), props, rc.__mgrId, () => rc.getLengthes('_def'), (err,imVM) => {
		freezer._def = freeze(imVM);
		_ready = true;
		updateDeps();
	});

	// init if needed
	if(key){
		if(onGraphDone){
			rc.onGraphDone(key,onGraphDone);
		}
		rc.addKey(key, obj);
	}

	rc.ready = () => _ready;
	// finalize
	// 1 - reinitializing events
	reinitOn(rc,waitFor);
	// 2 - done
	rc.__preprocessed = true;

	return rc;

}
