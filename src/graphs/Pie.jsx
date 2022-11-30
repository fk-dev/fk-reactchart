import React from 'react';

import { isEqual } from '../core/im-utils.js';
import { isNil } from '../core/utils.js';

export default class Pie extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	point(ang,rad,or){
		return {
			abs:   rad * Math.cos( (180 - ang) * Math.PI / 180) + or.x,
			ord: - rad * Math.sin( (180 - ang) * Math.PI / 180) + or.y
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
		const path = `M${x4},${y4} L${x3},${y3} A${radius},${radius} 0 ${laf},0 ${x2},${y2} L ${x1},${y1} A${toreRadius},${toreRadius} 0 ${laf},1 ${x4},${y4} Z`;
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
		const p2 = this.point(theta - 1,radius,origin);
		const x2 = p2.abs;
		const y2 = p2.ord;
		const p3 = this.point(theta + 1,radius,origin);
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

		oldT = startAngle;
		for(let p = 0; p < positions.length; p++){
			const label = labels[p] ? labels[p] : null;

			if(label){

				const theta = Math.min(positions[p].value, 359.9640);// more than 99.99% is a circle (not supported by arc anyway)
				const isEq = (a,b) => a < b + 1 && a > b - 1; // 1 deg
				const curAng = type === 'gauge' ? theta : theta / 2 + oldT;

				const pR   = !isNil(positions[p].pinRadius) ? positions[p].pinRadius * radius : pinRadius;
				const pL   = !isNil(positions[p].pinLength) ? positions[p].pinLength * radius : pinLength;
				const pO   = positions[p].pinOffset   ?? pinOffset;
				const pFS  = positions[p].pinFontSize ?? pinFontSize;
				const pD   = positions[p].pinDraw     ?? pinDraw;
				const hook = positions[p].pinHook     ?? pinHook;
				const hO   = isEq(curAng,90) || isEq(curAng,270) ? 0 :
					curAng > 90 && curAng < 270 ? hook + pFS/3 : - hook - pFS/3;
				const textAnchor = positions[p].textAnchor ?? ( isEq(curAng,90) || isEq(curAng,270) ? 'middle' :
							curAng > 90 && curAng < 270 ? 'start' : 'end' );

				const pc1 = this.point(curAng, pR, origin);
				const xc1 = pc1.abs;
				const yc1 = pc1.ord;
				const pc2 = this.point(curAng + (pO.alpha ?? 0), pR + pL, origin);
				const xc2 = pc2.abs + ( pO.x ?? 0 );
				const yc2 = pc2.ord + ( pO.y ?? 0 );
				const xc3 = xc2 + hO;
				const yc3 = yc2;
				const pl  = this.point(curAng + (pO.alpha ?? 0), pR + pL, origin);
				const xc = label.position?.x ?? pl.abs + ( pO.x ?? 0 ) + hO;
				const yc = label.position?.y ?? pl.ord + ( pO.y ?? 0 );

				if(pD){
					const lpath = `M${xc1},${yc1} L${xc2},${yc2}${xc3 !== xc2 ? ` L${xc3},${yc3}` : ''}`;
					out.push(<path key={`${p}.ll`} strokeWidth='1' stroke='black' fill='none' d={lpath}/>);
				}

				out.push(<text fill={label.color} fontSize={pFS} key={`${p}.l`} x={xc} y={yc} textAnchor={textAnchor}>{label.text}</text>);

				oldT += theta;
			}
		}

		return <g className={css ? 'pie' : ''}>{out}</g>;
	}
}
