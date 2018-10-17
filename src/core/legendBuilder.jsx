import React from 'react';
import { flatten, extend } from 'underscore';

import { iconer } from '../icons/iconer.jsx';
import { shader } from './colorMgr.js';
import * as evMgr from './events-mgr.js';

export const vm = {
	create: function(get, { props }){

	const events = evMgr.create(props.legend.events);

	// for icon, just to help reading
	const icw  = props.legend.iconWidth  - 2 * props.legend.iconHMargin;
	const ich  = props.legend.iconHeight - 2 * props.legend.iconVMargin;
	const ichm = props.legend.iconHMargin;
	const icvm = props.legend.iconVMargin;

	const getALegend = (data,gprops,idx) => {
		let icc = gprops.color;
		const sha = extend({},gprops.shader);
		if(sha && sha.options){
			sha.computation = sha.computation === 'by function' ? sha.computation : 'explicit';
			sha.type = 'color';
			sha.factor = [0.5];
			let col = {};
			shader(sha,[col]);
			icc = col.color;
		}
		const ics = gprops.width < 2 ? gprops.width * 1.5 : gprops.width; // slightly more bold, if needed
		const iconProps = {
			color: icc,
			width: icw,
			height: ich,
			hMargin: ichm,
			vMargin: icvm,
			strokeWidth: ics,
			faded: !props.graphProps[idx].show
		};
		let perPoint = [];
		if (data.series) {
			for(let p = 0; p < data.series.length; p++){
				if(data.series[p].legend){
					let point = data.series[p];
					let typeMark = gprops.markType;
					iconProps.color = point.color || shader(p);
					perPoint.push({
						icon: {
							icon: (pr) => <svg width={pr.width} height={pr.height}>
														{iconer(pr, typeMark)}
													</svg>,
							props: extend({},iconProps),
							
						},
						label: point.legend || 'data #' + idx,
						click: events.onClick(idx)
					});
				}
			}
		}

		return perPoint.length !== 0 ? perPoint :
			{
				icon: {
					icon: (p) => <svg width={p.width} height={p.height}>
											{gprops.onlyMarks ? null : iconer(p, 'line')}
											{gprops.mark ? iconer(p, gprops.markType) : null}
										</svg>,
					props: iconProps
				},
				label: gprops.name || 'graph #' + idx,
				click: events.onClick(idx)
			};
	};

	let leg = [];
	for(let i = 0; i < props.data.length; i++){
		leg.push(getALegend(props.data[i],props.graphProps[i],i));
	}

	return flatten(leg);
	}
};
