import React from 'react';
import Label from './Label.jsx';

import { toC, toCwidth } from '../core/space-transf.js';
import { isEqual } from '../core/im-utils.js';

/*
	{
		// long thin grey line
		grid: {
			show: true || false,
			color: '',
			length: ,
			width: 
		},

	// tick
		tick: {
			show: true || false,
			color: '',
			position: {x, y},
			ds: {x, y},
			length: ,
			dir: {x, y},
			width: ,
			out:
		},

	// tick label
		label: Label
	}
*/

export default class Tick extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	// grid
	grid(){

		const { type, placement, grid } = this.props.state;
		const { show, css, color, width, length } = grid;

		if(show === false){
			return null;
		}

		const start = {
			x: toC(this.props.state.tick.ds.x, this.props.state.tick.position.x),
			y: toC(this.props.state.tick.ds.y, this.props.state.tick.position.y)
		};

		const end = {
			x: start.x + this.props.state.tick.dir.x * toCwidth(this.props.state.tick.ds.x,length),
			y: start.y - this.props.state.tick.dir.y * toCwidth(this.props.state.tick.ds.y,length)
		};

		const gridName = this.props.className.length ? `${this.props.className}Grid` : '';
		const tickProps = {
			stroke: color, 
			strokeWidth: width
		};


		return <line className={css ? `grid-${type} grid-${type}-${placement} ${gridName}` : ''} x1={start.x} x2={end.x} y1={start.y} y2={end.y} {...tickProps} />;
	}

	tick(){

		const { type, placement, tick } = this.props.state;
		const { show, css, dir, length, out, position, ds, color, width } = tick;

		if(show === false){
			return null;
		}

		const x1 = toC(ds.x, position.x) - dir.x * length * out;
		const y1 = toC(ds.y, position.y) + dir.y * length * out; // beware about y sign!!
		const x2 = x1 + dir.x * length;
		const y2 = y1 - dir.y * length; // beware about y sign!!

		const linePar = {
			stroke: color, 
			strokeWidth: width
		};

		return <line className={css ? `tick-${type} tick-${type}-${placement} ${this.props.className}` : ''} x1={x1} x2={x2} y1={y1} y2={y2} {...linePar}/>;
	}

	label(){
		if(this.props.state.label.show === false){
			return null;
		}
		const { type, placement } = this.props.state;
		const labelName = `label-${type} label-${type}-${placement} ${this.props.className}Label`;
		return <Label className={labelName} state={this.props.state.label}/>;
	}

	noShow(){
		return !( this.props.state.tick.show || this.props.state.grid.show || this.props.state.label.show);
	}

	render(){

		return this.noShow() ? null : <g>
				{this.grid()}
				{this.tick()}
				{this.label()}
		</g>;
	}
}
