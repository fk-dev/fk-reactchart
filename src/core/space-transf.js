/*
 * various transformation between a data space
 * and a coordinate space.
 *
 * We have linear, we need:
 *
 *  - log
 *  - polar
 */

import { homothe, isNil, toValue } from './utils.js';

/**
 * ds is { c : {min, max}, d: {min,max}, c2d , d2c}
 */

export function toC(ds, data, offset){ return homothe(ds.d.min,ds.c.min,ds.d2c,data) + (offset ?? 0);}

export function toCwidth(ds, dist){
	let d = isNil(dist) ? 1 : toValue(dist);
	return Math.abs(ds.d2c * d);
}

export function toD(ds, coord){ return homothe(ds.c.min,ds.d.min,ds.c2d,coord);}

export function toDwidth(ds, dist){
	let d = isNil(dist) ? 1 : toValue(dist);
	return Math.abs(ds.c2d * d);
}

export function fromPic(ds,data){
	let fac = (ds.c.max - ds.c.min);
	return homothe(0,ds.c.min,fac,data);
}


/// for offset, in coordinate space (x,y)
/// or data space (dx,dy)
export function coordTrans(point,ds){

	const { x, y, dx, dy } = point;

	const _toC = () => ({
		x: dx ? toC(ds.x,dx) : null,
		y: dy ? toC(ds.y,dy) : null,
	});

	const _toD = () => ({
		x: x ? toD(ds.x,x) : null,
		y: y ? toD(ds.y,y) : null,
	});

	return {
		toC: _toC,
		toD: _toD
	};

}
