import React from 'react';
import { flatten, extend } from 'underscore';

import { iconer }      from '../icons/iconer.jsx';
import { shader }      from './colorMgr.js';
import * as evMgr      from './events-mgr.js';
import * as gradienter from './gradient-mgr.js';
import Gradienter      from '../Gradienter.jsx';

export const vm = {
	create: function(get, { props }){

	const events = evMgr.create(props.legend.events);

	// for icon, just to help reading
	const icw  = props.legend.iconWidth  - 2 * props.legend.iconHMargin;
	const ich  = props.legend.iconHeight - 2 * props.legend.iconVMargin;
	const ichm = props.legend.iconHMargin;
	const icvm = props.legend.iconVMargin;

	const getALegend = (data,gprops,idx,grad) => {
		let icc = gprops.color;
		const sha = extend({},gprops.shader);
			// will use css inline style
		if(sha && sha.options){
			// type is shade or color
			const colors = sha.type === 'shade' ? [icc, 'white'] : sha.options.colors;
			grad.id = gradienter.newGradient(colors);
		}
		const ics = gprops.width < 2 ? gprops.width * 1.5 : gprops.width; // slightly more bold, if needed
		const gradVM = gradienter.getAGradientVM(grad.id);
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
														{ gradVM ? <defs><Gradienter state={gradVM} /></defs> : null }
														{iconer(pr, typeMark, grad.id)}
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
											{ gradVM ? <defs><Gradienter state={gradVM} /></defs> : null }
											{gprops.onlyMarks ? null : iconer(p, 'line')}
											{gprops.mark ? iconer(p, gprops.markType, grad.id) : null}
										</svg>,
					props: iconProps
				},
				label: gprops.name || 'graph #' + idx,
				click: events.onClick(idx)
			};
	};

	let leg = [];
	for(let i = 0; i < props.data.length; i++){
		let grad = {};
		leg.push(getALegend(props.data[i],props.graphProps[i],i,grad));
		if(grad.id){
			gradienter.remove(grad.id);
		}
	}

	return flatten(leg);
	}
};
