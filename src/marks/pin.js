import { toC } from '../core/space-transf.js';
import { isNil, coord } from '../core/utils.js';

const _angle = (deg) => {

	let ang = deg%360;
	if(ang > 180){
		ang -= 360;
	}

	const isVert = Math.abs(ang) > 45 && Math.abs(ang) < 135;

	const dir = isVert ? ang < 0 ? -1 : 1 : ang > -45 && ang < 45 ? 1 : -1;
	const hookDir = isVert ? Math.abs(ang) < 90 ? 1 : -1 : ang > 0 ? 1 : -1;

	return {
		rad: ang * Math.PI / 180,
		isVert,
		dir,
		hookDir
	};
};

const nat = (d,p) => {

	const oDir = d === 'x' || d === 'r' ? 'y' : 'x';

	const ang = {
		x: {
			o: 0,
			i: 180
		},
		y: {
			o: 90,
			i: -90
		},
		r: {
			o: 90,
			i: -90
		}
	};


	return {
		isVert: d === 'x',
		rad: (p[oDir] < 0 ? ang[d].i : ang[d].o) * Math.PI / 180,
		dir: p[oDir] < 0 ? -1 : 1,
		hookDir: 1
	};

};

const angle = (ang,dir,pos) => ang === 'nat' ? nat(dir,pos) : _angle(ang);

// in fct so we don't compute if
// no tag
// tag = {
//	 pin: true || false // show the line
//	 pinHook:  // horizontal line
//	 pinLength: // length to mark
//	 print: // how to print
//	 theta: // angle from mark
// }
const pin = function(get, { pos, tag, ds, motherCss, dir }) {
	// angle
	const ang = angle(tag.pinAngle,dir,pos);
	// anchor
	let anchor = {
		top:		ang.isVert && ang.dir < 0,
		bottom: ang.isVert && ang.dir > 0,
		left:  !ang.isVert && ang.dir > 0,
		right: !ang.isVert && ang.dir < 0
	};

	const css = isNil(tag.css) ? motherCss : tag.css;

		// mark
	let mpos;
	if(dir === 'r'){
		const ra = toC(ds.r,pos.r);
		const cxy = coord.cart(ra,pos.theta);
		mpos = {
			x: cxy.x + ds.r.c.origin.x,
			y: cxy.y + ds.r.c.origin.y
		};
	}else{
		mpos = {
			x: toC(ds.x,pos.x),
			y: toC(ds.y,pos.y)
		};
	}

		// pin length
	const pl = {
		x: Math.cos(ang.rad) * tag.pinLength,
		y: Math.sin(ang.rad) * tag.pinLength,
	};

		// pin hook
	const ph = {
		x: ang.isVert ? ang.hookDir * tag.pinHook : 0,
		y: ang.isVert ? 0 : ang.hookDir * tag.pinHook
	};

	if(Math.abs(ph.x) > 1e-2){
		anchor.top = false;
		anchor.bottom = false;
		if(ph.x > 0){
			anchor.left = true;
		}else{
			anchor.right = true;
		}
	}

	if(Math.abs(ph.y) > 1e-2){
		anchor.left = false;
		anchor.right = false;
		if(ph.y > 0){
			anchor.top = true;
		}else{
			anchor.bottom = true;
		}
	}

	const baseline = anchor.top ? 'hanging' : anchor.bottom ? 'text-after-edge' : 'middle';

	// position = mark + length + hook
	const lpos = {
		x: mpos.x + pl.x + ph.x,
		y: mpos.y - pl.y + ph.y 
	};

		//y: lpos.y + ( anchor.top ? 0.9 * height : anchor.bottom ? - 0.25 * height : 0.25 * height )
	const lAnc = {
		x: lpos.x + ( anchor.left ? 3 : -3 ),
		y: lpos.y + ( anchor.top ? 3 : anchor.bottom ? -3 : 0 )
	};

	const path = `M ${mpos.x},${mpos.y} L ${mpos.x + pl.x},${mpos.y - pl.y} L ${lpos.x},${lpos.y}`;
	return {
    css,
		label: tag.print(pos),
		baseline,
		anchor,
		labelAnc: anchor.top || anchor.bottom ? 'middle' : anchor.left ? 'start' : 'end',
		labelFS: tag.fontSize,
		x: lpos.x,
		y: lpos.y,
		xL: lAnc.x,
		yL: lAnc.y,
		path: !tag.pin ? null : path,
		pinColor: tag.pinColor,
    pinWidth: tag.pinWidth,
		color: tag.color
	};
};


export let vm = {
	create: (get, { pos, tag, ds, motherCss, dir, measurer, cn }) => tag.show ? pin(get, { pos, tag, ds, motherCss, dir, measurer, cn }) : null
};
