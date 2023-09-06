import { isNil } from '../core/utils.js';
import { each, map } from 'underscore';
import { shader } from '../core/colorMgr.js';

export const vm = {
	create: (get, { serie, props, ds, motherCss }) => {

		// easy stuff
		const color  = props.color || 'back';
		const fill   = props.fill  || 'none';
		const	width  = isNil(props.width) ? 1 : props.width; // 0 is valid
		const stairs = props.stairs || 'right';
		const shade  = props.shade || 1;
		const css    = isNil(props.css) ? motherCss : css;
	
		const positions = map(serie, (point) => {return {x: point.x, y: point.y};});
		const drops = map(serie, (point) => {return {x: point.drop.x, y: point.drop.y};});
	
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
	
		const dlx = props.dropLine.x || false;
		const dly = props.dropLine.y || false;
	
		return {
			css,
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

