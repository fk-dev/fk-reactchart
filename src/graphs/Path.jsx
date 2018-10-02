import React from 'react';

import { map  } from 'underscore';
import { toC } from '../core/space-transf.js';
import { isEqual } from '../core/im-utils.js';

/*
	 {
		show: true || false,
		ds: {
			x: {},
			y: {}
		},
		color: '',
		fill: '',
		width: ,
		shade: ,
		positions: [{x: , y: }],
		drops: [{x: , y: }],
		close: {
			x: true || false,
			y: true || false
		},
		dropLine: {
			x: true || false,
			y: true || false
		}
	}
*/

export default class Path extends React.Component {

	shouldComponentUpdate(props) {
		return !isEqual(props.state,this.props.state);
	}


	render(){

		const { state } = this.props;

		if(state.show === false || state.positions.length === 0){
			return null;
		}

		const { ds, positions, drops, css } = state;
		const pos = positions;

		const coord = (idx) => `${toC(ds.x,pos[idx].x)},${toC(ds.y, pos[idx].y)}`;

		const dropx = (idx) => `${toC(ds.x,drops[idx].x)},${toC(ds.y, pos[idx].y)}`;

		const dropy = (idx) => `${toC(ds.x,pos[idx].x)},${toC(ds.y, drops[idx].y)}`;

		let points = `M ${coord(0)}`;
		for(let i = 1; i < state.positions.length; i++){
			points += ` L ${coord(i)}`;
		}

		// we close the curve if wanted
		// y dir has prevalence
		let filling = points;
		if(state.close.y){
			for(let i = drops.length - 1; i >= 0; i--){
				filling += ` L ${dropy(i)}`;
			}
		}else if(state.close.x){
			for(let i = drops.length - 1; i >= 0; i--){
				filling += ` L ${dropx(i)}`;
			}
		}
		filling += 'z';

// droplines
		let dropLines = [];
		const { color, width, shade, fill } = state;

		if(state.dropLine.y){
			dropLines = map(state.positions,(pos,idx) => {
				const path = `M ${coord(idx)} L ${dropy(idx)}`;
				const key = `${state.key}.dl.${idx}`;
				return <path key={key} d={path} stroke={color} strokeWidth={width} opacity={shade}/>;
			});
		}
		if(state.dropLine.x){
			dropLines = map(state.positions,(pos,idx) => {
				const path = `M ${coord(idx)} L ${dropx(idx)}`;
				const key = `${state.key}.dl.${idx}`;
				return <path key={key} d={path} stroke={color} strokeWidth={width} opacity={shade}/>;
			});
		}

		const props = {
			strokeWidth: width,
			stroke: color,
			opacity: shade,
		};

		return <g className={css ? this.props.className : ''}>
			{state.close.y || state.close.x ? <path
				d={filling} 
				strokeWidth={0}
				opacity={shade}
				fill={fill}/> : null }
			<path className={css ? 'curve' : ''} {...props} fill='none' d={points}/>
				{dropLines}
			</g>;
	}

}
