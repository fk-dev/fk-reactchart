import { isNil } from '../core/utils.js';
import { map } from 'underscore';

export let vm = {
	create: (get, { serie, props, ds }) => {

		// easy stuff
		let color = props.color || 'back';
		let fill = props.fill || 'none';
		let	width = isNil(props.width) ? 1 : props.width; // 0 is valid
		let shade = props.shade || 1;

		let positions = map(serie, ({ x, y }) => {
			return {
				x,
				y
			};
		});
		let drops = map(serie, ({ drop }) => {
			let { x, y } = drop;
			return {
				x,
				y
			};
		});

		let clx = false;
		let cly = fill !== 'none';

		let dlx = props.dropLine.x || false;
		let dly = props.dropLine.y || false;

		return {
			ds,
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
