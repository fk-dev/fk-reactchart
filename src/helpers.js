import { process, defaultTheProps, processLegend } from './core/process.js';
import { freeze } from './core/im-utils.js';
import { deepCp, isNil, measure, rndKey, emptyState } from './core/utils.js';
import { toC } from './core/space-transf.js';
import * as manip from './core/data-manip.js';
import { clear as clearGradient } from './core/gradient-mgr.js';

export function init(rawProps, type, Obj, debug){

	Obj = Obj || {};
	let { key, obj, namespace } = Obj;

	if(obj && !key){
		key = rndKey();
	}

	let hasDebug = debug;
	let props;
	let freezer = {
		_def: {
			get: () => emptyState
		}
	};
	const _process  = type === 'legend' ? processLegend : process;

	let updatee = {};
	let updated = {};
	let keys = key ? [key] : [];
	let vms = {};
	let pointsTo = {};
	let invPointsTo = {};

	namespace = {
		_def: namespace || 'reactchart'
	};

	const allOutOfDate = () => {
		for(let i in updated){
			updated[i] = false;
		}
	};

	const deleteKey = (k,ik) => {
		const _del = (arr) => {
			arr = arr || [];
			const i = arr.indexOf(k);
			if(i !== -1){
				arr.splice(i,1);
			}
		};


		// direct delete: updatee, updated, keys, pointsTo, invPointsTo
		_del(keys);
		delete updatee[k];
		delete updated[k];
		delete pointsTo[k];
		delete invPointsTo[k];
		// indirect: invPointsTo
		if(ik){
			_del(invPointsTo[ik]);
		}else{
			keys.forEach(key => _del(invPointsTo[key]));
		}
	};

	const updateDeps = (key) => {
		if(key === '_def'){ // nothing to forceUpdate for _def
			return;
		}

		const _updateOne = (_key) => {

			const invkey = pointsTo[_key];
			(invPointsTo[invkey] || []).forEach( k => {
				if(updatee[k] && updatee[k].forceUpdate){
					updatee[k].forceUpdate();
					updated[k] = true;
				}else if(updatee[k]){
					deleteKey(k,invkey);
				}
			});
		};

		if(key){
			_updateOne(key);
		}else{
			keys.forEach( k => k === '_def' ? null : _updateOne(k));
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
		if(k !== p){
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
			invPointsTo[p].push(k);
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
			vmPointsTo(_key,'_def');
			return {
				pointTo: '_def'
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
			if(!measurer[k]){
				addAMeasurer(k);
			}else{
				if(!measurer[k].mgr.active){
					measurer[k] = initMeasurer(measure(k, debug),k);
				}
			}
		}
	};

		// reset
	rc.setMeasurer = (key) => key ? addAMeasurer(key) : initMeasurers();
	rc.hasDebug = () => hasDebug;
	rc.setDebug = dbg => measurer.setDebug(dbg);

	// id
		// getter
	rc.isUpdated = (key) => updated[key];
		// setter
	rc.addKey = (key,obj) => {
		// beware if already there
		if(keys.indexOf(key) === -1){
			keys.push(key);
		}

		rc.setMeasurer(key);

		const k = pointsTo[key];
		if(obj){
			updatee[key] = obj;
			updated[key] = false;
		}
		if(!freezer[k] && k !== '_def'){
			_process(() => freezer[k].get(), props, rc.__mgrId, () => rc.getLengthes(k), (err, imVM) => {
				freezer[k] = freeze(imVM);
				freezer[k].on('update',() => updateDeps(k)); // last
				if(obj){
					rc.updateGraph(obj, key);
				}
			});
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
	rc.mgr              = (key) => key && freezer[pointsTo[key]] ? freezer[pointsTo[key]] : checkFreezer();
	rc.props   = rc.get = (key) => rc.mgr(key).get();
	rc.unprocessedProps = () => props;
	rc.legend           = (key) => type === 'legend' ? rc.props(key) : (rc.props(key) || {}).legend;
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
			rc.addKey(key);
		}

    obj.forceUpdate();

		if(!updatee[key]){
			updatee[key] = obj;
			updated[key] = true;
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
		// check measurer
		if(!rc.canMeasure()){
			rc.setMeasurer();
		}
		const _props = newProps || props;
		clearGradient(rc.__mgrId,newProps ? null : notUpToDate());
		allOutOfDate();
		props   = defaultTheProps(deepCp({},_props));
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
					updateDeps(key);
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
	_process(() => freezer._def.get(), props, rc.__mgrId, () => rc.getLengthes('_def'), (err,imVM) => {
		freezer._def = freeze(imVM);
		_ready = true;
		updateDeps();
	});

	// init if needed
	if(key){
		rc.addKey(key, obj);
	}

	let _ready = false;
	rc.ready = () => _ready;
	// finalize
  rc.__preprocessed = true;

	return rc;

}
