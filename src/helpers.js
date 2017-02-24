let core = require('./core/process.js');
let utils = require('./core/utils.js');
let space = require('./core/space-transf.js');
let legender = require('./core/legendBuilder.js');

let letters = 'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN';
let rnd = () => letters.charAt(Math.floor(Math.random() * letters.length));

let m = {};

m.init = function(rawProps,type){

	let props = rawProps;
	props.freeze = type;

	let freezer = core.process(props,true);
	props = core.defaultTheProps(utils.deepCp({},props));

	let updatee = {};

	// super quick, should not be needed to be strong
	let genKey = () => {
		let key = rnd() + rnd();
		while(!utils.isNil(updatee[key])){
			key = rnd() + rnd();
		}
		return key;
	};

	let updateDeps = () => {
		for(let i in updatee){
			if(!!updatee[i].forceUpdate){
				updatee[i].forceUpdate();
			}else{
				delete updatee[i];
			}
		}
	};

	let remove = (idx) => {
		// raw
		props.data.splice(idx,1);
		props.graphProps.splice(idx,1);
		// freezer
		freezer.get().curves.splice(idx,1);
	};

	let addition = (data,graphp) => {
		// raw
		props.data.push(data);
		props.graphProps.push(graphp);
		// freezer
		rc.reinit(props);
	};

	let rc = {};

	rc.props = () => freezer.get();

	rc.mgr = () => freezer;

	rc.toC = (point) => {
		return {
			x: space.toC(point.ds.x,point.position.x),
			y: space.toC(point.ds.y,point.position.y)
		};
	};

  rc.__preprocessed = true;

	rc.legend = () => legender(props);

  rc.updateGraph = (obj, key) => {
		if(utils.isNil(key)){
			key = genKey();
		}
		if(!updatee[key]){
			updatee[key] = obj;
		}
	};

	rc.reinit = (newProps) => {
		props = utils.deepCp({},newProps);
		freezer = core.process(props);
		props = core.defaultTheProps(utils.deepCp({},props));
		freezer.on('update',() => updateDeps());
		updateDeps();
	};

	rc.delCurve = remove;
	rc.addCurve = addition;

	freezer.on('update',() => updateDeps());

	return rc;

};

module.exports = m;
