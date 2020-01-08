import { isNil, coord } from '../core/utils.js';
import { toC } from '../core/space-transf.js';
const { cart } = coord;

export let vm = {
	create: (get, { props, motherCss, cs, serie, ds }) => {

		// easy stuff
		const color = props.color || 'back';
		const fill  = props.fill || 'none';
		const	width = isNil(props.width) ? 1 : props.width; // 0 is valid
		const shade = props.shade || 1;
		const css   = isNil(props.css) ? motherCss : css;

		const points = cs === 'polar' ? `M ${serie.map( ({ r, theta }) => {
			const _r = toC(ds.r,r);
			const { x, y } = cart(_r,theta);
			return `${x + ds.r.c.origin.x},${y + ds.r.c.origin.y}`;
		}).join(' ')} z` : null;

		const clx = false;
		const cly = fill !== 'none';

		return {
			css,
			show: cs === 'polar',
			color,
			fill,
			width,
			shade,
			path: { points },
			close: {
				x: clx,
				y: cly
			},
		};
	}
};
