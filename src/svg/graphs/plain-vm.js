import { isNil, coord } from '../core/utils.js';
const { cart } = coord;

export const vm = {
	create: (get, { serie, props, ds, cs, motherCss }) => {

		// easy stuff
		const color = props.color || 'back';
		const fill  = props.fill || 'none';
		const	width = isNil(props.width) ? 1 : props.width; // 0 is valid
		const shade = props.shade || 1;
		const css   = isNil(props.css) ? motherCss : css;

		const positions = serie.map( ({ x, y, r, theta }) => 	cs === 'cart' && !isNil(x) ? {x, y} : cart(r,theta));
		const drops = serie.map( ({ drop }) => {
			const { x, y } = drop;
			return {
				x,
				y
			};
		});

		const clx = false;
		const cly = fill !== 'none';

		const dlx = props.dropLine.x || false;
		const dly = props.dropLine.y || false;

		return {
			cs,
			ds,
			css,
			color,
			fill,
			shade,
			width,
			positions,
			drops,
			close: {
				x: clx,
				y: cly
			},
			dropLine: {
				x: dlx,
				y: dly
			}
		};
	}
};
