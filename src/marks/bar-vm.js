import { isDate, makePeriod, isNil } from '../core/utils.js';

export const vm = {
	create: (get, { position, props, ds, key, motherCss, onSelect, unSelect, curveIdx }) => {

		const vm = get;

		const defSpan = {
			x: isDate(position.x) ? makePeriod({months: 3}) : 0.5,
			y: isDate(position.y) ? makePeriod({months: 3}) : 0.5
		};
	
		const draw  = props.markProps.draw || position.draw         || false;
		const color = position.color       || props.markProps.color || props.markColor || props.color || 'black';
		const width = position.width       || props.markProps.width || draw ? 1 : 0;
		const fill  = position.fill        || props.markProps.fill  || color;
		const shade = position.shade       || props.markProps.shade || 1;
		const span  = position.span        || props.span            || defSpan;
		const css   = isNil(props.css) ? motherCss : props.css;

		const onClick = () => {
			vm().set('selected', !vm().selected);
			let out = position;
			position.serieIdx = curveIdx;
			return vm().selected ? onSelect(out) : unSelect();
		};
	
		return {
			selected: false,
			unselect: () => vm().set('selected',false),
			key,
			css,
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
			shade,
			onClick
		};
	}
};
