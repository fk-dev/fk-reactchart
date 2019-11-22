import { isNil } from '../core/utils.js';

export const vm = {
	create: (get, { position, props, ds, key, open, motherCss, onSelect, unSelect, curveIdx }) => {

		const vm = get;

		const draw  = props.markProps.draw || position.draw         || false;
		const color = position.color       || props.markProps.color || props.markColor || props.color || 'black';
		const width = draw || open ? position.width || props.markProps.width || 1 : 0;
		const size  = position.size        || props.markProps.size  || props.markSize || 3;
		const shade = position.shade       || props.markProps.shade || 1;
		const css    = isNil(props.css) ? motherCss : props.css;

		const fill  = open ? 'none' : position.fill || props.markProps.fill || color;

		const onClick = () => {
			vm().set('selected', !vm().selected);
			let out = position;
			out.serieIdx = curveIdx;
			return vm().selected ? onSelect(out) : unSelect();
		};
	
	
		return {
			selected: false,
			unselect: () => vm().set('selected',false),
			open,
			key,
			css,
			draw,
			ds,
			position:{
				x: position.x,
				y: position.y
			},
			color,
			width,
			fill,
			size,
			shade,
			onClick
		};
	}
};


export const ovm = {
	create: (get, { position, props, ds, key, motherCss, onSelect, unSelect } ) => {
		props.markProps.draw = true;
		return vm.create(get, { position, props, ds, key, open: true, motherCss, onSelect, unSelect });
	}
};
