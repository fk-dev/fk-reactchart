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
		const { gIdx, state, index } = this.props;
		const { ds, position, size, fill, color, shade, width, css, open } = state;

		const x = toC(ds.x,position.x) - size;
		const y = toC(ds.y,position.y) - size;
		const f = fill || color;

		const rectProps = { width: 2 * size, height: 2 * size, fill: f, opacity: shade, stroke: color, strokeWidth: width };

		return <rect onClick={state.onClick} className={`${css ? `mark mark-${gIdx} mark-${gIdx}-${index}${open ? ' open' : ''}` : ''}${state.selected ? ' selected' : ''}`} x={x} y={y} {...rectProps}/>;
	}
}
