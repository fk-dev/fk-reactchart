import React from 'react';
import { toC } from '../core/space-transf.js';
import { isEqual } from '../core/im-utils.js';

/*
	{
		draw: true || false,
		ds: {
			x: {}, 
			y:{}
		},
		position: {
			x: 0,
			y: 0
		},
		radius: ,
		color: '',
		width: ,
		fill: ,
		size: ,
		shade: 1
	}
*/

export default class DotMark extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){
		const { gIdx, state, index, selectable } = this.props;
		const { ds, position, size, color, radius, fill, shade, width, css, open } = state;

		const x = toC(ds.x,position.x);
		const y = toC(ds.y,position.y);
		const r = radius || size;
		const f = fill || color;

		const cProps = { r: r, fill: f, opacity: shade, stroke: color, strokeWidth: width };

		const click = selectable ? () => {
			return state.onClick();
		} : null;
		const circ = () => <circle onClick={click} className={css ? `mark mark-${gIdx} mark-${gIdx}-${index}${open ? ' open': ''}` : ''} cx={x} cy={y} {...cProps}/>;

		return state.selected ? <g className='selected'>{circ()}</g>: circ();
	}
}
