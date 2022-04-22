import { map, reduce } from 'underscore';
import { toC, toCwidth} from '../core/space-transf.js';
import { isNil } from '../core/utils.js';
import { shader } from '../core/colorMgr.js';

export const vm = {

	create: function(get, { serie, props, ds, onSelect, unSelect }){

		const vm = get;

		const sum	= reduce(serie, (memo, value) => memo + value.value, 0);
		const angleMax = props.pie === 'gauge' ? 180 : 360;
		const val = v => props.pieNoStack ? v/props.gaugeMaxVal : v/sum;
		const positions = map(serie, (point,idx) => {
			return {
				value: Math.max(Math.min(val(point.value) * angleMax,angleMax),0),
				color: point.color || shader(idx)
			};
		});

		const origin = {
			x: toC(ds.x, props.pieOrigin.x + (ds.x.d.max + ds.x.d.min)/2),
			y: toC(ds.y, props.pieOrigin.y + (ds.y.d.max + ds.y.d.min)/2)
		};

		let labels = [];
		if(props.tag.show){
			labels = map(serie, (val) => props.tag.print(val));
		}

		const maxR = Math.min( toCwidth(ds.x,ds.x.d.max - ds.x.d.min) / 2, toCwidth(ds.y,ds.y.d.max - ds.y.d.min) / 2);

		const radius = isNil(props.pieRadius) ? maxR : Math.min(maxR,props.pieRadius);

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
			radius,
			toreRadius: props.pieToreRadius * radius,
			labels,
			pinRadius: props.tag.pinRadius * radius,
			pinLength: props.tag.pinLength * radius,
			pinHook: props.tag.pinHook,
			pinDraw: props.tag.pin,
			pinFontSize: props.tag.fontSize,
			onClick
		};
	}
};
