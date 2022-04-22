import React from 'react';

import { isEqual } from '../core/im-utils.js';

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

	area(oldT,position,idx){
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
		const path = `M${x4},${y4} L${x3},${y3} A${radius},${radius} 0 ${laf},0 ${x2},${y2} L ${x1},${y1} A${toreRadius},${toreRadius} 0 ${laf},1 ${x4},${y4}`;
		return <path className={pieClass(idx)} onClick={() => idx < 0 ? null : onClick(idx)} key={idx} fill={color} stroke='none' strokeWidth='0' d={path}/>;
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
			pinRadius, pinLength, pinHook, pinDraw, pinFontSize, 
			origin, type, gaugeColor, fill } = path;

		if(positions.length === 0){
			return null;
		}


		let oldT = 0;
		let out = [];

		if(type === 'gauge'){
			out.push(this.area(0,{color: fill || gaugeColor, value: 180},-1));
		}

		for(let p = 0; p < positions.length; p++){

			// path of point
			out.push( type ==='gauge' ? this.gauge(positions[p],p) : this.area(oldT,positions[p],p));

			const theta = Math.min(positions[p].value, 359.9640);// more than 99.99% is a circle (not supported by arc anyway)

			const label = labels[p] ? labels[p] : null;

			if(label){

				const isEq = (a,b) => a < b + 1 && a > b - 1; // 1 deg

				const curAng = type === 'gauge' ? theta : theta / 2 + oldT;
				const offset = isEq(curAng,90) || isEq(curAng,270) ? 0 :
					curAng > 90 && curAng < 270 ? pinHook : - pinHook;
				const pc1 = this.point(curAng, pinRadius, origin);
				const xc1 = pc1.abs;
				const yc1 = pc1.ord;
				const pc2 = this.point(curAng, pinRadius + pinLength, origin);
				const xc2 = pc2.abs;
				const yc2 = pc2.ord;
				const xc3 = xc2 + offset;
				const yc3 = yc2;
				const xc = xc3 + offset / 2;
				const yc = yc2 + ( isEq(curAng,90) ? - 5 : isEq(curAng,270) ? 5 : 0) ;
				const textAnchor = isEq(curAng,90) || isEq(curAng,270) ? 'middle' :
							curAng > 90 && curAng < 270 ? 'start' : 'end';
				if(pinDraw){
					const lpath = `M${xc1},${yc1} L${xc2},${yc2} L${xc3},${yc3}`;
					out.push(<path key={`${p}.ll`} strokeWidth='1' stroke='black' fill='none' d={lpath}/>);
				}
				out.push(<text fontSize={pinFontSize} key={`${p}.l`} x={xc} y={yc} textAnchor={textAnchor}>{label}</text>);
			}
			//x = x2;
			//y = y2;
			oldT += theta;
		}

		return <g className={css ? 'pie' : ''}>{out}</g>;
	}
}
