const clickers = {
	fade: (mgr,lId, idx) => {
		const faded = !mgr.props(lId).curves[idx].show;
		// curve
		mgr.dynamic.toggle.curve(idx);

		// legend
		mgr.legend(lId)[idx].icon.props.set('faded', !faded);
	},

	del: (mgr, lId, idx) => {
		// redefine
		mgr.unprocessedProps(lId).graphProps[idx].show = !mgr.props(lId).curves[idx].show;

		// recompute
		mgr.reinit(mgr.unprocessedProps(lId));
	}
};

export function create(types){

	const { onClick } = types;

	let rc = {};

	rc.onClick = (idx) => onClick ? (mgr,lId) => clickers[onClick](mgr,lId,idx) : () => null;

	rc.hasClick = onClick;

	return rc;

}
