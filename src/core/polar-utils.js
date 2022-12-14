const { abs, cos, sin, atan, floor, PI } = Math;

const MARGIN = 10;

function toRad(deg){
	return deg * PI / 180;
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

function to2PI(x){
	if(x < 0){
		x += (floor(-x/360) + 1) * 360;
	}
	return x%360;
}

function SVGAngleCorrection(deg){
	return to2PI(- deg + 180);
}

function angleFromOffset(offset, fallback){

	const { alpha, x, y } = offset;

	const _angle = () => {

		if(x && y){
			return atan(y/x);
		}else if(y && !x){
			return y > 0 ? -90 : 90;
		}else if(!y && x){
			return x > 0 ? 0 : 180;
		}
	};

	const out = to2PI(alpha ? alpha + fallback :  _angle() ?? fallback);

	return out;
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

function anchorFromAngle(theta){

	return isUp(theta) || isDown(theta) ? 'middle' : isRight(theta) ? 'start' : 'end';

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

export function anchorOfLabel({ pinOffset, theta }){

	const _theta = SVGAngleCorrection(theta);
	
	const pinAngle = angleFromOffset(pinOffset, _theta);

	return anchorFromAngle(pinAngle);
}

export * from "./polar-search.js";
