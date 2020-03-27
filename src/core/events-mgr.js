const clickers = {
	fade: (mgr,lId, idx) => {
		const faded = !mgr.props(lId).curves[idx].show;
		// curve
		mgr.dynamic.toggle.curve(idx);

		// legend
		mgr.legend(lId)[idx].icon.props.set('faded', !faded);
	},

	del: (mgr, lId, idx) => {

		const value = !mgr.props(lId).curves[idx].show;

		// redefine
		mgr.unprocessedProps(lId).graphProps[idx].show = value;

		// legend
		mgr.legend(lId)[idx].icon.props.set('faded', !value);

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
