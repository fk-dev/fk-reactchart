import { map, reduce } from 'underscore';
import { toC, toCwidth} from '../core/space-transf.js';
import { isNil } from '../core/utils.js';
import { shader } from '../core/colorMgr.js';

export let vm = {

	create: function(get, { serie, props, ds }){

		let sum	= reduce(serie, (memo, value) => memo + value.value, 0);
		let positions = map(serie, (point,idx) => {return {
			value: Math.max(Math.min(point.value/sum * 360,360),0),
			color: point.color || shader(idx)
		};});

		let origin = {
			x: toC(ds.x, props.pieOrigin.x + (ds.x.d.max + ds.x.d.min)/2),
			y: toC(ds.y, props.pieOrigin.y + (ds.y.d.max + ds.y.d.min)/2)
		};

		let labels = [];
		if(props.tag.show){
			labels = map(serie, (val) => props.tag.print(val.tag));
		}

		let maxR = Math.min( toCwidth(ds.x,ds.x.d.max - ds.x.d.min) / 2, toCwidth(ds.y,ds.y.d.max - ds.y.d.min) / 2);

		let radius = isNil(props.pieRadius) ? maxR : Math.min(maxR,props.pieRadius);

		return {
			ds,
			fill: props.pie !== 'tore',
			positions,
			origin,
			radius,
			toreRadius: props.pieToreRadius * radius,
			labels,
			pinRadius: props.tag.pinRadius * radius,
			pinLength: props.tag.pinLength * radius,
			pinHook: props.tag.pinHook,
			pinDraw: props.tag.pin,
			pinFontSize: props.tag.fontSize
		};
	}
};
