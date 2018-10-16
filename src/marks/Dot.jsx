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
		const { css, gIdx, state, index } = this.props;
		const { ds, position, size, color, radius, fill, shade, width } = state;

		const x = toC(ds.x,position.x);
		const y = toC(ds.y,position.y);
		const r = radius || size;
		const f = fill || color;

		const cProps = css ? null : { r: r, fill: f, opacity: shade, stroke: color, strokeWidth: width };

		return <circle className={`mark mark-${gIdx}.${index}`} cx={x} cy={y} {...cProps}/>;
	}
}
