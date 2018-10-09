import { isDate, makePeriod } from '../core/utils.js';

export let vm = {
	create: (get, { position, props, ds, key }) => {

		let defSpan = {
			x: isDate(position.x) ? makePeriod({months: 3}) : 0.5,
			y: isDate(position.y) ? makePeriod({months: 3}) : 0.5
		};
	
		let draw  = props.markProps.draw || position.draw         || false;
		let color = position.color       || props.markProps.color || props.markColor || props.color || 'black';
		let width = position.width       || props.markProps.width || draw ? 1 : 0;
		let fill  = position.fill        || props.markProps.fill  || color;
		let shade = position.shade       || props.markProps.shade || 1;
		let span  = position.span        || props.span            || defSpan;
	
		return {
			key,
			draw,
			ds,
			position: {
				x: position.x,
				y: position.y
			},
			drop:{
				x: position.drop.x,
				y: position.drop.y
			},
			span,
			color,
			width,
			fill,
			shade
		};
	}
};
