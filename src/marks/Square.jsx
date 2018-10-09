import React from 'react';
import { toC } from '../core/space-transf.js';
import { isEqual } from '../core/im-utils.js';

/*
	{
		draw: false,
		ds: {
			x: {},
			y: {}
		},
		position:{
			x: 0,
			y: 0
		},
		color: 'black',
		width: 0,
		fill: null,
		size: 0,
		shade: 1
	}
*/

export default class SquareMark extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){
		let { css, gIdx, state } = this.props;
		let { ds, position, size, fill, color, shade, width} = state;

		let x = toC(ds.x,position.x) - size;
		let y = toC(ds.y,position.y) - size;
		let f = fill || color;

		let rectProps = css ? null : { width: 2 * size, height: 2 * size, fill: f, opacity: shade, stroke: color, strokeWidth: width };

		return <rect className={'mark mark-' + gIdx} x={x} y={y} {...rectProps}/>;
	}
}
