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

export function toC(ds, data){ return homothe(ds.d.min,ds.c.min,ds.d2c,data);}

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
