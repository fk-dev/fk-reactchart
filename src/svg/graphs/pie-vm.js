import { toC } from '../core/space-transf.js';
import { isNil } from '../core/utils.js';
import { shader } from '../core/colorMgr.js';
import { anchorsAndLabels } from '../core/polar-utils.js'; 

export const vm = {

	create: function(get, { serie, props, ds, onSelect, unSelect }){
		const vm = get;

		const radius = props.pieRadius;
		const isGauge = props.pie === 'gauge';

		const sum	= serie.reduce( (memo, value) => memo + value.value, 0);
		const angleMax = isGauge ? 180 : 360;
		const val = v => props.pieNoStack ? v/props.gaugeMaxVal : v/sum;
		const positions = serie.map( (point,idx) => {
			const value = Math.max(Math.min(val(point.value) * angleMax,angleMax),0);
			return {
				...point,
				color: point.color || shader(idx),
				value
			};
		});

		const origin = ds.r ? {
			x: ds.r.c.origin.x + props.pieOrigin.x,
			y: ds.r.c.origin.y + props.pieOrigin.y
		} : {
			x: toC(ds.x, new Date(props.pieOrigin.x + (ds.x.d.max.getTime() + ds.x.d.min.getTime())/2)),
			y: toC(ds.y, props.pieOrigin.y + (ds.y.d.max + ds.y.d.min)/2)
		};

		let labels = [];
		if(props.tag.show){
			const tmpSer = positions.map( pos => {
				return {...pos, value: pos.theta * 180 / Math.PI};
			});
			const opts = {
				radius: props.pieRadius ?? radius,
				dir: props.pieDir,
				angleOffset: props.pie === 'gauge' ? -180 : null,
				notCumulative: props.pie === 'gauge' || ["radar","Bars","yBars"].indexOf(props.type) !== -1,
				isRadar: false,
				startAngle: props.pie === 'gauge' ? -180 : props.pieStartAngle
			};
			labels = anchorsAndLabels(tmpSer,ds.r.c.origin,opts).map( (sol,i) => {
				const val = serie[i];
				return {
					...sol,
					text: props.tag.print(val), color:  val.tagColor ?? props.tag?.color, position: val.label
				};
			});
		}

		const onClick = (p) => {
			vm().set('selected',p === vm().selected ? null : p);
			let position = serie[p];
			position.tag = labels[p];
			position.rel = ( positions[p].value / 360 * 100).toFixed(2);
			return !isNil(vm().selected) ? onSelect(position) : unSelect();
		};

		return {
			selected: null,
			unselect: () => vm().set('selected',null),
			isSelected: p => p === vm().selected,
			ds,
			gaugeColor: props.gaugeColor,
			type: props.pie,
			fill: props.fill || props.pie === 'disc',
			positions,
			origin,
			startAngle: props.pieStartAngle || 0,
			radius,
			direction: -props.pieDir,
			toreRadius: props.pieToreRadius * radius,
			labels,
			pinRadius: props.tag.pinRadius * radius,
			pinLength: props.tag.pinLength * radius,
			pinHook: props.tag.pinHook,
			pinDraw: props.tag.pin,
			pinFontSize: props.tag.fontSize,
			pinOffset: props.tag.pinOffset,
			pieSep: props.pieSep,
			pieSepColor: props.pieSepColor,
			onClick
		};
	}
};
