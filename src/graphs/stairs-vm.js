import { isNil } from '../core/utils.js';
import { each, map } from 'underscore';
import { shader } from '../core/colorMgr.js';

export let vm = {
	create: (get, { serie, props, ds }) => {

		// easy stuff
		let color = props.color || 'back';
		let fill = props.fill || 'none';
		let	width = isNil(props.width) ? 1 : props.width; // 0 is valid
		let stairs = props.stairs || 'right';
		let shade = props.shade || 1;
	
		let positions = map(serie, (point) => {return {x: point.x, y: point.y};});
		let drops = map(serie, (point) => {return {x: point.drop.x, y: point.drop.y};});
	
		// color can be bin-defined
		// 1 - a shader
		if(!isNil(props.shader) && props.shader.type === 'fill'){ // we don't care about 'color'
			shader(props.shader,positions);
		}
	
		// 2 - explicit, takes precedence
		each(serie, (point,idx) => {
			if(!isNil(point.fill)){
				positions[idx].fill = point.fill;
			}
		});
	
		let dlx = props.dropLine.x || false;
		let dly = props.dropLine.y || false;
	
		return {
			ds,
			color,
			fill,
			shade,
			width,
			stairs,
			positions,
			drops,
			dropLine: {
				x: dlx,
				y: dly
			}
		};
	}
};

