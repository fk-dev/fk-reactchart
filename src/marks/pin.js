import { toC } from '../core/space-transf.js';
import { isNil } from '../core/utils.js';

const _angle = (deg) => {

	while(deg < -180){
		deg += 360;
	}
  while(deg > 180){
		deg -= 360;
  }

	const v = Math.abs(deg) > 45 && Math.abs(deg) < 135;

	return {
		rad: deg * Math.PI / 180,
		isVert: v,
		dir: v ? deg < 0 ? -1 : 1 : deg > -45 && deg < 45 ? 1 : -1
	};
};

const nat = (d,p) => {

	const other = d === 'x' ? 'y' : 'x';

	const ang = {
		x: {
			s: 0,
			i: 180
		},
		y: {
			s: 90,
			i: -90
		}
	};

	return {
		isVert: d === 'x',
		rad: (p[other] > 0 ? ang[other].s : ang[other].i) * Math.PI / 180,
		dir: p[other] > 0 ? 1 : -1
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
	const anchor = {
		top:		ang.isVert && ang.dir > 0,
		bottom: ang.isVert && ang.dir < 0,
		left:  !ang.isVert && ang.dir > 0,
		right: !ang.isVert && ang.dir < 0
	};

		// mark
	const mpos = {
		x: toC(ds.x,pos.x),
		y: toC(ds.y,pos.y)
	};

		// pin length
	const pl = {
		x: Math.cos(ang.rad) * tag.pinLength,
		y: Math.sin(ang.rad) * tag.pinLength,
	};

		// pin hook
	const ph = {
		x: ang.isVert ? 0 : ang.dir * tag.pinHook,
		y: ang.isVert ? ang.dir * tag.pinHook : 0
	};

	// position = mark + length + hook
	const lpos = {
		x: mpos.x + pl.x + ph.x,
		y: mpos.y - pl.y + ph.y 
	};

	const lAnc = {
		x: lpos.x + (anchor.left ? 3 : -3),
		y: lpos.y + (anchor.top ? tag.fontSize : anchor.bottom ? -3 : 1)
	};

	const path = `M ${mpos.x},${mpos.y} L ${mpos.x + pl.x},${mpos.y - pl.y} L ${lpos.x},${lpos.y}`;
	return {
    css: isNil(tag.css) ? motherCss : tag.css,
		label: tag.print(pos),
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
	create: (get, { pos, tag, ds, motherCss }) => tag.show ? pin(get, { pos, tag, ds, motherCss }) : null
};
