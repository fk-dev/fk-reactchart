const { PI, sin, cos, max, min, abs } = Math;

const offsetH = _theta => {
	const theta = 2*PI - _theta;
	if(theta < PI/2){
		return 1 - sin(theta);
	}else{
		return 1 + sin(theta);
	}
};

const offsetV = _theta => {
	const theta = 2*PI - _theta;
	if(theta < PI/2 || theta > 3/2*PI){
		return 1 - cos(theta);
	}else if(theta < 3/2*PI){
		return 1 + cos(theta);
	}
};

const hOM  = (r,{length, theta}) => length - r * offsetH(theta);
const vOM  = (r,{length, theta}) => length - r * offsetV(theta);

export function radius(width,height,labelLengthes){
	const rightL  = labelLengthes.filter( ({theta}) => theta < PI/2);
	const leftL   = labelLengthes.filter( ({theta}) => theta > PI/2);
	const topL    = labelLengthes.filter( ({theta}) => theta < PI/2 || theta > 3/2*PI);
	const bottomL = labelLengthes.filter( ({theta}) => theta > PI/2 && theta < 3/2*PI);

	const right  = r => max.apply(null,  rightL.map( ({theta,labelLength}) => hOM(r,{theta, length: labelLength.width})));
	const left   = r => max.apply(null,   leftL.map( ({theta,labelLength}) => hOM(r,{theta, length: labelLength.width})));
	const top    = r => max.apply(null,    topL.map( ({theta,labelLength}) => vOM(r,{theta, length: labelLength.height})));
	const bottom = r => max.apply(null, bottomL.map( ({theta,labelLength}) => vOM(r,{theta, length: labelLength.height})));

	const hLength = r => 2*r + right(r) + left(r);
	const vLength = r => 2*r + top(r)   + bottom(r);

	let cur = min(width,height)/2 * 0.8;
	let delta = 2;
	let loop = 0;
	let step = min(width,height)/100;
	let dir = 1;
	const eps = 1; // in px
	while(abs(delta) > eps && loop < 100){
		cur += step;
		const rWidth  = hLength(cur);
		const rHeight = vLength(cur);
		delta = min(width - rWidth, height - rHeight);
		if(delta * dir < 0){
			step /= -2;
			dir *= -1;
		}
		loop++;
	}

	return {
		r: cur,
		outerMargins: {
			left:   left(cur),
			right:  right(cur),
			top:    top(cur),
			bottom: bottom(cur)
		}
	};
}
