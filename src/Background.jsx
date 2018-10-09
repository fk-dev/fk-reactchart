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
		const x = this.props.state.spaceX.min;
		const y = this.props.state.spaceY.max;
		const width = this.props.state.spaceX.max - this.props.state.spaceX.min;
		const height = this.props.state.spaceY.min - this.props.state.spaceY.max;
		return this.props.state.color === 'none' ? null : <rect width={width} height={height} strokeWidth='0' fill={this.props.state.color} x={x} y={y}/>;

	}
}
