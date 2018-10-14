import React from 'react';
import { toCwidth as _toCwidth, toC as _toC} from '../core/space-transf.js';
import { isNil, mgr as typeMgr } from '../core/utils.js';
import { isEqual } from '../core/im-utils.js';

/*
	{
		draw: false,
		ds: {
			x: {}, // see space-mgr for details
			y: {}
		}, // see space-mgr for details
		position:{
			x:0,
			y:0
		},
		drop:{
			x:null, 
			y:0
		},
		width: 0,
		span: 0.5,
		color: '',
		fill: '',
		shade: 1
	}
*/

export default class BarMark extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render() {

		const { state, gIdx, index } = this.props;

		const mgr = {
			x: typeMgr(state.position.x),
			y: typeMgr(state.position.y)
		};

		const ds = state.ds;

		const position = state.position;

		const span = {
			x: isNil(state.span.x) ? 0 : state.span.x,
			y: isNil(state.span.y) ? 0 : state.span.y 
		};

		const drop = {
			x: isNil(state.drop.x) ? state.position.x : state.drop.x,
			y: isNil(state.drop.y) ? state.position.y : state.drop.y 
		};

		const toC = (dir) => {
			const op = dir === 'y' ? 'add' : 'subtract';
			return _toC(ds[dir], mgr[dir][op](position[dir],mgr[dir].divide(span[dir],2))); // all in dataSpace
		};

		let x = toC('x');
		let y = toC('y');

		const toCwidth = (dir) => _toCwidth(ds[dir], mgr[dir].add(mgr[dir].distance(drop[dir],position[dir]), span[dir]));

		const height = toCwidth('y');
		const width  = toCwidth('x');
		if(mgr.y.lowerThan(position.y,drop.y)){
			y -= height;
		}
		if(mgr.x.greaterThan(position.x,drop.x)){
			x -= width;
		}

		const color = state.color || state.fill || 'none';
		const stroke = state.draw ? color : null;
		if(drop.y > state.y){
			y -= height;
		}

		const { strokeWidth, shade, css } = state;
		const rProps = { height, width, stroke, strokeWidth, fill: color, opacity: shade };

		return <rect className={css ? `mark mark-${gIdx} mark-${gIdx}-${index}` : ''} x={x} y={y} {...rProps}/>; 
	}
}
