import React from 'react';

import { isEqual } from '../core/im-utils.js';
import { isNil, isString } from '../core/utils.js';
import { offsetOfHook, offsetOfLabel, anchorOfLabel, isDown, toAngle, angleFromOffset } from '../core/polar-utils.js';

export default class Pie extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	point(ang,rad,or,dir,offset){
		offset = offset ?? 0;
		dir = dir ?? 1;
		return {
			abs:   rad * Math.cos( (dir * ang + offset) * Math.PI / 180) + or.x,
			ord: - rad * Math.sin( (dir * ang + offset) * Math.PI / 180) + or.y
		};
	}

	area(oldT,position,idx,stroke,strokeWidth){
		const {state: { path: { origin, radius, toreRadius, onClick, isSelected, fill }, css } } = this.props;

		const color = position.color || fill;
		const theta = Math.min(position.value, 359.9640);// more than 99.99% is a circle (not supported by arc anyway)

		const p1 = this.point(oldT,toreRadius,origin);
		const x1 = p1.abs;
		const y1 = p1.ord;
		const p2 = this.point(oldT,radius,origin);
		const x2 = p2.abs;
		const y2 = p2.ord;
		const p3 = this.point(theta + oldT,radius,origin);
		const x3 = p3.abs;
		const y3 = p3.ord;
		const p4 = this.point(theta + oldT,toreRadius,origin);
		const x4 = p4.abs;
		const y4 = p4.ord;

		const pieClass = p => p < 0 ? ( css ? 'background-gauge' : '' ) : `${css ? `mark mark-${p}` : ''}${isSelected(p) ? ' selected' : ''}`;

		// large-arc-flag, true if theta > 180
		const laf = theta > 180 ? 1 : 0;
		const path = `M${x4},${y4} L${x3},${y3} A${radius},${radius} 0 ${laf},1 ${x2},${y2} L ${x1},${y1} A${toreRadius},${toreRadius} 0 ${laf},0 ${x4},${y4} Z`;
		stroke = strokeWidth ? ( stroke ? stroke : 'white' ) : 'none';
		strokeWidth = strokeWidth || '0';
		return <path className={pieClass(idx)} onClick={() => idx < 0 ? null : onClick(idx)} key={idx} fill={color} stroke={stroke} strokeWidth={strokeWidth} d={path}/>;
	}

	gauge(position,idx){
		const {state: { path: { origin, radius, onClick, isSelected }, css } } = this.props;

		const color = position.color;
		const theta = Math.min(position.value, 359.9640);// more than 99.99% is a circle (not supported by arc anyway)

		const x1 = origin.x;
		const y1 = origin.y;
		const p2 = this.point(theta - 1,radius,origin,-1,180);
		const x2 = p2.abs;
		const y2 = p2.ord;
		const p3 = this.point(theta + 1,radius,origin,-1,180);
		const x3 = p3.abs;
		const y3 = p3.ord;

		const pieClass = p => `${css ? `mark mark-${p}` : ''}${isSelected(p) ? ' selected' : ''}`;
		
		const path = `M${x1},${y1} L${x2},${y2} A${radius},${radius} 0 0,0 ${x3},${y3} L${x1},${y1}`;
		return <path className={pieClass(idx)} onClick={() => onClick(idx)} key={idx} fill={color} stroke='none' strokeWidth='0' d={path}/>;
	}

	render(){
		const { state } = this.props;
		const { path, css } = state;
		const { labels, positions, 
			pinRadius, pinLength, pinHook, pinDraw, pinFontSize, pinOffset,
			origin, type, gaugeColor, fill, pieSep, pieSepColor,
			startAngle, radius } = path;

		if(positions.length === 0){
			return null;
		}

		let oldT = startAngle;
		let out = [];

		if(type === 'gauge'){
			out.push(this.area(0,{color: fill || gaugeColor, value: 180},-1, pieSepColor, pieSep));
		}

		for(let p = 0; p < positions.length; p++){

			// path of point
			out.push( type ==='gauge' ? this.gauge(positions[p],p) : this.area(oldT,positions[p],p,pieSepColor, pieSep));
			const theta = Math.min(positions[p].value, 359.9640);// more than 99.99% is a circle (not supported by arc anyway)
			oldT += theta;
		}
	// labels written over
		for(let p = 0; p < positions.length; p++){
			if(labels[p]){

				const pFS  = labels[p].pinFontSize ?? pinFontSize;
				const pD   = labels[p].pinDraw     ?? pinDraw;
				const hook = labels[p].pinHook     ?? pinHook;
				const { cD, cP, cH, cL, text, color } = labels[p];
				if(pD){
					const lpath = `M${cD.x},${cD.y} L${cP.x},${cP.y}${hook ? ` L${cH.x},${cH.y}` : ''}`;
					out.push(<path key={`${p}.ll`} strokeWidth='1' stroke='black' fill='none' d={lpath}/>);
				}

				out.push(<text fill={color} fontSize={typeof pFS === 'number' ? `${pFS}pt` : pFS} key={`${p}.l`} x={cL.x} y={cL.y} textAnchor={cL.textAnchor}>{text}</text>);
			}
		}

		return <g className={css ? 'pie' : ''}>{out}</g>;
	}
}
