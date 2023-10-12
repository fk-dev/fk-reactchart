import { shader } from './colorMgr.js';
import { isNil } from './utils.js';
const { abs, sqrt, cos, acos, sin, atan, floor, PI, min, max } = Math;

const MARGIN = 10;

function toRad(deg){
	return deg * PI / 180;
}

function fromRad(rad){
	return rad / PI * 180;
}

function isUp(deg){
	return abs(deg - 90) <= MARGIN;
}

export function isDown(deg){
	return abs(deg - 270) <= MARGIN;
}

function isLeft(deg){
	return deg > 90 + MARGIN && deg < 270 - MARGIN;
}

function isRight(deg){
	return deg < 90 - MARGIN || deg > 270 + MARGIN;
}

export function toAngle({offset, angle}){
	const ofa = {
		x: cos(toRad(angle)),
		y: sin(toRad(angle))
	};
	const newOffset = {
		x: ( offset.x ?? 0 ) + ofa.x,
		y: ( offset.y ?? 0 ) + ofa.y
	};

	return angleFromOffset(newOffset);
}

function to2PI(x){
	let out = x%360;
	while(x < 0){
		x += 360;
	}
	return x;
}

function to2PIRad(x){
	let out = x%(2*PI);
	while(x < 0){
		x += 2 * PI;
	}
	return x;
}

function SVGAngleCorrection(angle,isRad,dir,offset){
	dir = dir ?? -1;
	offset = isRad ? toRad(offset ?? 0 ) : offset ?? 0;
	return isRad ? to2PIRad( dir * angle + offset ) : to2PI( dir * angle + offset );
}

export function angleFromOffset(offset, fallback){

	fallback = fallback ?? 0;

	const { alpha, x, y } = offset;

	const angleOffset = (c,s) => c < 0 ? (s > 0 ? -PI : PI ) : 0;
	const mod = x => to2PIRad(x + 2*PI);

	const _angle = () => {

		if(!isNil(x) && !isNil(y)){
			return x ? fromRad(mod(atan(y/x) + angleOffset(x,y))) :  // x def => atan
				y > 0 ? 90 : // x === 0 && y > 0
					y < 0 ? -90 : // x === 0 && y < 0
						0; // x === 0 && y === 0
		}else{
			return 0;
		}
	};

	// start angle used if no offset (angle === 0)
	return to2PI(alpha ? alpha :  ( _angle() || fallback) );
}


function offsetFromAngle({theta,pinFontSize}, size){

	const xLength = pinFontSize/3 * cos(toRad(theta));
	const yLength = pinFontSize/3 * sin(toRad(theta));

	return {
		x: isLeft(theta) ? - xLength - size.width : xLength,
		y: isDown(theta) ? yLength + size.height : yLength
	};
}

function hookOffsetFromPin({pinAngle, pinHook}){

	return {
		x: isRight(pinAngle) ? pinHook : isLeft(pinAngle) ? - pinHook : 0,
		y: 0
	};
				
}

function labelOffsetFromPin({ pinAngle, pinFontSize },size){

	const min = pinFontSize/3;
	const y = isUp(pinAngle) ? - min : isDown(pinAngle) ? min + size.height : 0;
	const x = y !== 0 ? 0 : isRight(pinAngle) ? min : - min - size.width;

	return {
		x, y
	};
				
}

export function offsetOfLabel({ pinOffset, pinFontSize, pinLength, theta },size){

	const _theta = SVGAngleCorrection(theta);

	if(!pinLength){
		return offsetFromAngle({theta: _theta,pinFontSize},size);
	}
	
	const pinAngle = angleFromOffset(pinOffset, _theta);

	return labelOffsetFromPin({pinAngle, pinFontSize},size);
}

export function offsetOfHook({ pinOffset, pinLength, pinHook, theta }){

	const _theta = SVGAngleCorrection(theta);

	if(!pinLength){
		return {x: 0, y: 0};
	}
	
	const pinAngle = angleFromOffset(pinOffset, _theta);

	return hookOffsetFromPin({pinAngle, pinHook});
}

////////////////////////////////
export function anchorFromAngle(theta,radius,inverse,isAxis){

	/// dir = 1 => inversion 0 et 180

	const s = sin(theta);

	const _anchorFromAngleTag = () => {
		if(theta >= 5 * PI/3 || theta <= PI/3){
			return inverse ? 'end' : 'start';
		}else if( 2 * PI/3 <= theta && theta <= 4 * PI/3){
			return inverse ? 'start' : 'end';
		}else{
			return 'middle';
		}
	};

	const _anchorFromAngleAxis = () => {
		const lowerThan   = (val,ref) => val < ref*0.95;
		const greaterThan = (val,ref) => val > ref*1.05;
		if(greaterThan(theta,3*PI/2) || lowerThan(theta,PI/2)){
			return 'start';
		}else if( greaterThan(theta, PI/2) && lowerThan(theta,3*PI/2)){
			return 'end';
		}else{
			return 'middle';
		}
	};

	const _anchorFromAngle = isAxis ? _anchorFromAngleAxis : _anchorFromAngleTag;

	const textAnchor = _anchorFromAngle();

	const vertOffset = width => {

		const l = width/(2 * radius);
		const ll = 1 - abs(cos(theta)) ;
		const cosbeta = 1 - ( ll + l);
		const sinbeta = abs(cosbeta) > 1 ? 1 : sqrt(1 - cosbeta * cosbeta);
		const dd = 1 - sinbeta;
		const d = 1 - abs(s);
		const length = d - dd;
		return ( s < 0 ? length : - length ) * radius;
	};

	const offsetFromAngle  = h => ( s < 0 ? - 0.5 * (s - 1) : 0 ) * h;
	const verticalOffset   = w => textAnchor === 'middle' ? vertOffset(w) : 0;
	const offsetFromAnchor = textAnchor === 'middle' && s > 0 ? -3 : 0;

	const axisSpace = isAxis && textAnchor === 'middle' ? - abs(s)/s * 7 : 0;

	const textOffset = {
		x: textAnchor === 'start' ? 3 : textAnchor === 'end' ? -3 : 0,
		y: (width,height) => offsetFromAngle(height) + verticalOffset(width) + offsetFromAnchor + axisSpace
	};

	return {textAnchor, textOffset};

}

/// point: alpha is local (from previous point), r is distance to center
/// offset: (alpha || x, y)
function onePointToNext(start,offset,length,origin,angleDir,angleOffset){


	// SVG angle (y is reversed)
	const angle = a => SVGAngleCorrection(a,true,angleDir,angleOffset);

	// apply alpha offset and x,y angle offset
	let end = {
		alpha: to2PIRad( ( offset.alpha ?? 0 ) + atan( ( offset.y ?? 0 ) / ( offset.x || 1) ) + ( start.alpha ?? 0 ) )
	};

	// apply (x,y) and (alpha,length) offset
	// SVG y is reversed
	end.x = start.x + cos(angle(end.alpha)) * length + ( offset.x ?? 0 );
	end.y = start.y + sin(angle(end.alpha)) * length - ( offset.y ?? 0 );

	// r
	end.r = sqrt( (end.x - origin.x) * (end.x - origin.x) + (end.y - origin.y) * (end.y - origin.y) );

	return end;

}

function hookAlpha(_angle){

	// [0, 2 PI[
	const angle = to2PIRad(_angle);

	// 0 and 180 preferred
	if(angle <= PI/3 || angle >= 5 * PI/3){
		return - angle; // theta = 0
	}else if(angle < 2*PI/3){
		return PI / 2 - angle; // theta = PI / 2
	}else if(angle <= 4 * PI/3){
		return PI - angle; // theta = PI
	}else if(angle < 5 * PI/3){
		return 3 * PI/2 - angle; // theta = -PI/2
	}
}

export function anchorsAndLabels(serie, origin={x:0,y:0},radius,dir,angleOffset,notCumulative,isRadar){

	let out = [];

	let _curAlpha = 0;
	for(let p = 0; p < serie.length; p++){

		const alpha = Math.min(serie[p].value, 359.9640);// more than 99.99% is a circle (not supported by arc anyway)

		const labelAlpha = notCumulative ? alpha : _curAlpha +  (alpha - _curAlpha)/2;
		_curAlpha = alpha;

		const pR  = serie[p].pinRadius * radius;
		const pL  = serie[p].pinLength * radius;
		const pO  = serie[p].pinOffset;
		const pFS = serie[p].pinFontSize;
		const hL  = serie[p].pinHook;
		const labelWidth  = serie[p].labelWidth;
		const labelHeight = serie[p].labelHeight;

		/// point
		const firstOffset = { alpha: toRad(labelAlpha) };
		const pc1 = onePointToNext(origin,firstOffset,pR,origin,dir,angleOffset);
		const xc1 = pc1.x;
		const yc1 = pc1.y;

		/// pin
		const pc2 = onePointToNext(pc1,pO,pL,origin,dir,angleOffset);
		const xc2 = pc2.x;
		const yc2 = pc2.y;

		/// hook
		/// hook is theta = 0 || 90 || 180 || 270
		const hO  = {
			alpha: hL ? hookAlpha(pc2.alpha) : 0 
		};

		const pc3 = onePointToNext(pc2,hO,hL,origin,dir,angleOffset);
		const xc3 = pc3.x;
		const yc3 = pc3.y;
		const labelAngle = pc3.alpha;

		const { textAnchor, textOffset } = anchorFromAngle(labelAngle,radius,dir === 1,isRadar);

		const xc = xc3 + textOffset.x;
		const yc = yc3 + textOffset.y(serie[p].labelWidth,serie[p].labelHeight);
		// coord data (cD), coord pin (cP), coord hook (cH), coord label (cL)
		out.push({cD: {x: xc1, y: yc1}, cP: {x: xc2, y: yc2}, cH: {x: xc3, y: yc3}, cL: {x: xc, y: yc, alpha: pc3.alpha, textAnchor, labelWidth, labelHeight } });
	}

	return out;
}

export function radius(world,tags,angleDir,angleOffset, notCumulative,isRadar){

	function leftOff({ textAnchor, labelWidth }){
		switch(textAnchor){
			case 'start':
				return 0;
			case 'middle':
				return labelWidth/2;
			case 'end':
				return labelWidth;
			default:
				throw new Error('No textAnchor!!!');
		}
	}

	function rightOff({ textAnchor, labelWidth }){
		switch(textAnchor){
			case 'start':
				return labelWidth;
			case 'middle':
				return labelWidth/2;
			case 'end':
				return 0;
			default:
				throw new Error('No textAnchor!!!');
		}
	}

	function computeWidthHeight(rad){

		const pos = anchorsAndLabels(tags, {x:0,y:0},rad,angleDir,angleOffset,notCumulative,isRadar);

		const { left, right, top, bottom } = pos.reduce( (memo,v) => {
			const { cL } = v;
			const locLeft   = cL.x - leftOff(cL);
			const locRight  = cL.x + rightOff(cL);
			const locTop    = cL.y - cL.labelHeight;
			const locBottom = cL.y;
			const { left, right, top ,bottom } = memo;
			return {
				left:    left   > locLeft   ? locLeft   : left,
				right:   right  < locRight  ? locRight  : right,
				top:     top    > locTop    ? locTop    : top,
				bottom:  bottom < locBottom ? locBottom : bottom
			};
		}, {right: rad, left: -rad, top: -rad, bottom: notCumulative && angleDir === 1 ? 0 : rad});

		return { width: right - left, height: bottom - top, left: -left, top: -top};
	}

	let radiusCand = min(world.width/2,world.height/2) * 0.8;
	let delta = 1e30;
	let step = radiusCand/5;
	let loop = 0;
	let dir = 1;
	let solWidth, solHeight, solLeft, solTop;
	const EPSILON = 1;
	const NLOOP_MAX = 100;
	while( (delta < 0 || delta > EPSILON) && loop < NLOOP_MAX){
		const { width, height, left, top } = computeWidthHeight(radiusCand);
		const dW = world.width - width;
		const dH = world.height - height;
		const locDelta = delta;
		delta = min(dW,dH);
		if(delta * dir < 0){
			step /= -2;
			dir *= -1;
		}
		radiusCand += step;
		solWidth  = width;
		solHeight = height;
		solLeft   = left;
		solTop    = top;
		loop++;
	}


	return {
		r: radiusCand,
		innerMargins: {
			left:   (world.width - solWidth)/2,
			right:  (world.width - solWidth)/2,
			top:    (world.height - solHeight)/2,
			bottom: (world.height - solHeight)/2
		},
		originOffset: {
			x: solLeft + (world.width  - solWidth) / 2,
			y: solTop  + (world.height - solHeight)/ 2
		}
	};

}

