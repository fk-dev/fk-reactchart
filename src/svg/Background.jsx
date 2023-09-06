import React from 'react';
import { isEqual } from './core/im-utils.js';

/*
	{
		width: ,
		height: ,
		color: ,
		spaceX: {
			min: , 
			max:
		},
		spaceY: {
			min: ,
			max:
		}
	}
*/

export default class Background extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){
		const { spaceX, spaceY, color, css } = this.props.state;

		const x = spaceX.min;
		const y = spaceY.max;
		const width = spaceX.max - spaceX.min;
		const height = spaceY.min - spaceY.max;
		const opts = {
			fill: color
		}; 
		return !css && color === 'none' ? null : <rect className={css ? 'background' : ''} width={width} height={height} {...opts} strokeWidth='0' x={x} y={y}/>;

	}
}
