let clickers = {
	fade: (mgr,idx) => {
		let faded = mgr.props().curves[idx].show;
		// curve
		mgr.dynamic.toggle.curve(idx);

		// legend
		mgr.get().legend[idx].icon.props.set('faded', !faded);
	},

	del: (mgr,idx) => {
		// redefine
		mgr.unprocessedProps().graphProps[idx].show = !mgr.props().curves[idx].show;

		// recompute
		mgr.reinit(mgr.unprocessedProps());
	}
};

export function create(types){

	let { onClick } = types;

	let rc = {};

	rc.onClick = (idx) => onClick ? (mgr) => clickers[onClick](mgr,idx) : () => null;

	return rc;

}
