import React from 'react';

import { toC }                    from '../core/space-transf.js';
import { isEqual }                from '../core/im-utils.js';
import { isNil, toNumber, coord as computeCoord } from '../core/utils.js';
import { renderText }             from '../marks/label-text.jsx';

/*
	{
		ds: {x: , y:},
		position: {x: , y:},
		label: '',
		FSize: ,
		offset: {x, y},
		anchor: '',
		color: '',
		dir: {x, y},
		rotate: true || false,
		transform: true || false
	},
*/

export default class Label extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	power(label, props){
		const { base, power } = label;
		return <text {...props}>
			<tspan>{base}</tspan>
			{ power !== 0 ? <tspan>&#183;10</tspan> : null }
			{ power !== 0 ? <tspan dy={-0.5 * toNumber(props.fontSize)}>{power}</tspan> : null }
		</text>;
	}

	render(){

		if(this.props.state.label.length === 0){
			return null;
		}

// label
		// => theta = arctan(y/x) [-90,90]

		const { state, className } = this.props;

		const { transform, ds, position, offset, rotate, angle, dir, color, FSize, anchor, label, howToRotate, LLength, LHeight, LLineHeight, css, cs } = state;

		const cart = () => {
			const xL = ( transform ? toC(ds.x,position.x) : position.x ) + offset.x;
			const yL = ( transform ? toC(ds.y,position.y) : position.y ) + offset.y;
			return {xL, yL};
		};

		const polar = () => {
			const r =  transform ? toC(ds.r,position.r) : position.r;

			const { theta } = position;
			const { x, y } = computeCoord.cart(r,theta);

			const xL = x + offset.x + ds.r.c.origin.x;
			const yL = y + offset.y + ds.r.c.origin.y;

			return {xL,yL};
		};

		const coord = cs === 'polar' ? polar() : cart();

		const theta = isNil(angle) ? rotate ? Math.floor( Math.atan( - Math.sqrt( dir.y / dir.x ) ) * 180 / Math.PI ) : 0 : angle; // in degrees

		const alpha = theta * Math.PI/180; // radians

		const rotation = ({xL, yL}) => `rotate(${theta} ${xL} ${yL})`;

		const ly = - dir.x * (1 - Math.cos(alpha)) * LHeight;
		const lx =  LLength ?  dir.x * (1 - Math.cos(alpha)) * LLength : 0;
		const translation = lx && ly && ( Math.abs(lx) > 1 || Math.abs(ly) > 1 ) ? `translate(${lx},${2 *ly})` : ''; // projection

		const rotateAnchor = theta * howToRotate;

		const props = ({xL, yL},key) => {
			return {
				className: css ? className : '',
				x: xL,
				y: yL, 
				transform: `${translation} ${rotation({xL, yL})}`,
				textAnchor: rotateAnchor  > 0 ? 'start' : rotateAnchor < 0 ? 'end' : anchor,
				fill: color,
				fontSize: typeof FSize === 'number' ? `${FSize}pt` : FSize,
				title: state.title,
				key
			};
		};

		const _write = (point,key) => isNil(label.base) ? renderText(props(point,key),label,'else',LLineHeight) : this.power(label,props(point,key));
		const write = Array.isArray(coord) ? () => <g>{coord.map( (point,i) => _write(point,`lT.${position.r}.${i}`))}</g> : () => _write(coord);

		const rectMe = () => {
			const bck = s => `${s.split(' ').join('-background ')}-background`;
			const hoff = LHeight * 0.2; // descent
			const mar  = 3;
			//
			const _xr = (xL,textAnchor) => xL - (textAnchor === 'start' ? 0 : textAnchor === 'end' ? LLength : LLength/2) - mar;
			const _yr = yL => yL - LHeight + hoff - mar;
			const textAnchor = Array.isArray(coord) ? coord.map(c => props(c).textAnchor) : props(coord).textAnchor;
			const rcoord = Array.isArray(coord) ? coord.map( ({xL,yL},i) => {
				return {
					xr: _xr(xL,textAnchor[i]), 
					yr: _yr(yL)
				};
			}) : {xr: _xr(coord.xL,textAnchor), yr: _yr(coord.yL)};

			const wr = LLength + 2*mar;
			const hr = LHeight + 2*mar;

			const _rects = ({xL,yL},{xr,yr}, key) => <rect key={key} x={xr} y={yr} width={wr} height={hr} fill='none' transform={`${translation} ${rotation({xL,yL})}`} className={bck(className)}/>;
			const rects = () => Array.isArray(coord) ? coord.map( (xy,i) => _rects(xy,rcoord(i),`rect.${position.r}.{i}`)) : _rects(coord,rcoord);

			return <g>
				{rects()}
				{write()}
			</g>;
		};

		return css ? rectMe() : write();
	}
}
