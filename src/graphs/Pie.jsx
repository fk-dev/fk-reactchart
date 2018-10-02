import React from 'react';

import { isEqual } from '../core/im-utils.js';

export default class Pie extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){

		const { path, css } = this.props.state;
		const { labels, positions, 
			pinRadius, pinLength, pinHook, pinDraw, pinFontSize, 
			origin, radius, toreRadius } = path;

		if(positions.length === 0){
			return null;
		}

		const abs = (ang,rad,or) =>   rad * Math.cos(ang * Math.PI / 180) + or.x;
		const coo = (ang,rad,or) => - rad * Math.sin(ang * Math.PI / 180) + or.y;

		let oldT = 0;
		let out = [];
	//	let x = abs(oldT,radius,origin);
	//	let y = coo(oldT,radius,origin);

		for(let p = 0; p < positions.length; p++){

			const color = positions[p].color;
			const theta = Math.min(positions[p].value, 359.9640);// more than 99.99% is a circle (not supported by arc anyway)
			const label = labels[p] ? labels[p] : null;
			const x1 = abs(oldT,toreRadius,origin);
			const y1 = coo(oldT,toreRadius,origin);
			const x2 = abs(oldT,radius,origin);
			const y2 = coo(oldT,radius,origin);
			const x3 = abs(theta + oldT,radius,origin);
			const y3 = coo(theta + oldT,radius,origin);
			const x4 = abs(theta + oldT,toreRadius,origin);
			const y4 = coo(theta + oldT,toreRadius,origin);

			// large-arc-flag, true if theta > 180
			const laf = theta > 180 ? 1 : 0;
			const path = `M${x1},${y1} L${x2},${y2} A${radius},${radius} 0 ${laf},0 ${x3},${y3} L ${x4},${y4} A${toreRadius},${toreRadius} 0 ${laf},1 ${x1},${y1}`;

			out.push(<path key={p} fill={color} stroke='none' strokeWidth='0' d={path}/>);

			if(label){
				const curAng = theta / 2 + oldT;
				const offset = curAng === 90 || curAng === 270 ? 0 :
					curAng > 90 && curAng < 270 ? - pinHook : pinHook;
				const xc1 = abs(curAng, pinRadius, origin);
				const yc1 = coo(curAng, pinRadius, origin);
				const xc2 = abs(curAng, pinRadius + pinLength, origin);
				const yc2 = coo(curAng, pinRadius + pinLength, origin);
				const xc3 = xc2 + offset;
				const yc3 = yc2;
				const xc = xc3 + offset / 2;
				const yc = yc2 + ( curAng === 90 ? - 5 : curAng === 270 ? 5 : 0) ;
				const lstyle = {
					textAnchor: curAng === 90 || curAng === 270 ? 'center' :
							curAng > 90 && curAng < 270 ? 'end' : 'start'
				};
				if(pinDraw){
					const lpath = `M${xc1},${yc1} L${xc2},${yc2} L${xc3},${yc3}`;
					out.push(<path key={`${p}.ll`} strokeWidth='1' stroke='black' fill='none' d={lpath}/>);
				}
				out.push(<text fontSize={pinFontSize} key={`${p}.l`} x={xc} y={yc} style={lstyle}>{label}</text>);
			}
			//x = x2;
			//y = y2;
			oldT += theta;
		}

		return <g className={css ? 'pie' : ''}>{out}</g>;
	}
}
