const { PI, sin, cos, max, min, abs } = Math;

const hOM = (r,{length, theta}) => max(0, ( r + length) * abs(cos(theta)) - r);
const vOM = (r,{length, theta}) => max(0, ( r + length) * abs(sin(theta)) - r);

const hTag = (r,d,{length, theta}) => max(0,d * abs(cos(theta)) + length - r);
const vTag = (r,d,{length, theta}) => max(0,d * abs(sin(theta)) + length - r);

const SVGAngleCorrection = a => PI - a;
const SVGAngle = t => {
  let angle = SVGAngleCorrection(t)%(2*PI);
  if(angle < 0){
    angle += 2 * PI;
  }
  return angle;
};

export function radius(width,height,labelLengthes, tags, forced){

	const filterRight  = l => l.filter( ({theta}) => SVGAngle(theta) <= PI/2 || SVGAngle(theta) >= 3/2*PI).map(x => ({...x, theta: SVGAngle(x.theta)}));
	const filterLeft   = l => l.filter( ({theta}) => SVGAngle(theta) >= PI/2 && SVGAngle(theta) <= 3/2*PI).map(x => ({...x, theta: SVGAngle(x.theta)}));
	const filterTop    = l => l.filter( ({theta}) => SVGAngle(theta) <= PI).map(x => ({...x, theta: SVGAngle(x.theta)}));
	const filterBottom = l => l.filter( ({theta}) => SVGAngle(theta) >= PI).map(x => ({...x, theta: SVGAngle(x.theta)}));

	const _rightL  = filterRight(labelLengthes);
	const _leftL   = filterLeft(labelLengthes);
	const _topL    = filterTop(labelLengthes);
	const _bottomL = filterBottom(labelLengthes);

	const rightL  = _rightL.length  ? _rightL  : [{force: true}];
	const leftL   = _leftL.length   ? _leftL   : [{force: true}];
	const topL    = _topL.length    ? _topL    : [{force: true}];
	const bottomL = _bottomL.length ? _bottomL : [{force: true}];


	const right  = r => max.apply(null,  rightL.map( ({force, theta,labelLength}) => force ? 0 : hOM(r,{theta, length: labelLength.width})));
	const left   = r => max.apply(null,   leftL.map( ({force, theta,labelLength}) => force ? 0 : hOM(r,{theta, length: labelLength.width})));
	const top    = r => max.apply(null,    topL.map( ({force, theta,labelLength}) => force ? 0 : vOM(r,{theta, length: labelLength.height})));
	const bottom = r => max.apply(null, bottomL.map( ({force, theta,labelLength}) => force ? 0 : vOM(r,{theta, length: labelLength.height})));

	const _rightT  = filterRight(tags);
	const _leftT   = filterLeft(tags);
	const _topT    = filterTop(tags);
	const _bottomT = filterBottom(tags);

	const rightT  = _rightT.length  ? _rightT  : [{force: true}];
	const leftT   = _leftT.length   ? _leftT   : [{force: true}];
	const topT    = _topT.length    ? _topT    : [{force: true}];
	const bottomT = _bottomT.length ? _bottomT : [{force: true}];

	const val = x => x ?? 0;
	const tRight  = r => max.apply(null,  rightT.map( ({force, theta, width,  offset, toRadius, radiusFactor }) => force ? 0 : hTag(r, r * toRadius * radiusFactor + val(offset.r),{theta, length: width  + val(offset.x)})));
	const tLeft   = r => max.apply(null,   leftT.map( ({force, theta, width,  offset, toRadius, radiusFactor }) => force ? 0 : hTag(r, r * toRadius * radiusFactor + val(offset.r),{theta, length: width  + val(offset.x)})));
	const tTop    = r => max.apply(null,    topT.map( ({force, theta, height, offset, toRadius, radiusFactor }) => force ? 0 : vTag(r, r * toRadius * radiusFactor + val(offset.r),{theta, length: height + val(offset.y)})));
	const tBottom = r => max.apply(null, bottomT.map( ({force, theta, height, offset, toRadius, radiusFactor }) => force ? 0 : vTag(r, r * toRadius * radiusFactor + val(offset.r),{theta, length: height + val(offset.y)})));

	const hLength = r => 2*r + max(right(r),tRight(r)) + max(left(r),tLeft(r));
	const vLength = r => 2*r + max(top(r),tTop(r))     + max(bottom(r),tBottom(r));

	let cur = forced ?? min(width,height)/2 * 0.8;
	let delta = 2;
	let loop = 0;
	let step = min(width,height)/100;
	let dir = 1;
	const eps = 1; // in px
	if(!forced){
		while( ( delta < 0 || abs(delta) > eps ) && loop < 100 ){
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
	}
	return {
		r: cur,
		outerMargins: {
			left:   left(cur)   + tLeft(cur),
			right:  right(cur)  + tRight(cur),
			top:    top(cur)    + tTop(cur),
			bottom: bottom(cur) + tBottom(cur)
		}
	};
}
