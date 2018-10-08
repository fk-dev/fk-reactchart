import { isNil } from '../core/utils.js';

export const vm = {
	create: (get, { position, props, ds, key, open, motherCss }) => {

		const draw   = props.markProps.draw  || position.draw          || false;
		const color  = position.color        || props.markProps.color  || props.markColor || props.color || 'black';
		const width  = draw || open ? position.width || props.markProps.width  || 1 : 0;
		const size   = position.size         || props.markProps.size   || props.markSize  || 3;
		const radius = position.radius       || props.markProps.radius || size;
		const shade  = position.shade        || props.markProps.shade  || 1;
		const css    = isNil(props.css) ? motherCss : props.css;

		const fill = open ? 'none' : position.fill || props.markProps.fill || color;
	
		return {
			open,
			key,
      css,
			draw,
			ds,
			position: {
				x: position.x,
				y: position.y
			},
			radius,
			color,
			width,
			fill,
			size,
			shade
		};
	}
};

export const ovm = {
	create: (get, { position, props, ds, key, motherCss }) => {
		props.markProps.draw = true;

		return vm.create(get, { position, props, ds, key, open: true, motherCss });
	}
};
