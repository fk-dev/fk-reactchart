import React from 'react';
import Label from './Label.jsx';

import { toC, toCwidth } from '../core/space-transf.js';
import { isEqual } from '../core/im-utils.js';
import { isNil } from '../core/utils.js';

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

		const { state, className } = this.props;
		const { type, placement, grid, tick } = state;
		const { show, css, color, width, length, cycle, dim } = grid;
		const { position, ds, dir } = tick;

		if(show === false){
			return null;
		}

		const tickProps = {
			stroke: color, 
			strokeWidth: width
		};

		const gridName = className.length ? `${className}Grid` : '';

		const cart = () => {

			const start = {
				x: toC(ds.x, position.x),
				y: toC(ds.y, position.y)
			};

			const end = {
				x: start.x + dir.x * toCwidth(ds.x,length),
				y: start.y - dir.y * toCwidth(ds.y,length)
			};

			return <line className={css ? `grid-${type} grid-${type}-${placement} ${gridName}` : ''} x1={start.x} x2={end.x} y1={start.y} y2={end.y} {...tickProps} />;
		};

		const polar = () => {

			const r = toC(ds.r,position.r);
			if(cycle){

				const cx = ds.r.c.origin.x;
				const cy = ds.r.c.origin.y;
				return <circle className={css ? `grid-${type} grid-${type}-${placement} ${gridName}` : ''} cx={cx} cy={cy} r={r} {...tickProps}/>;
			}else{
				let xs = [];
				let ys = [];
				for(let i = 0; i < dim.length; i++){
					const theta = dim[i].theta;
					xs.push(r * Math.cos(theta) + ds.r.c.origin.x);
					ys.push(r * Math.sin(theta) + ds.r.c.origin.y);
				}
				const path = `M ${xs.map( (x,i) => `${x},${ys[i]}`).join(' L')} z`;
				return <path d={path} stroke={color} strokeWidth={width} fill='none'/>;
			}

		};

		return isNil(this.props.state.tick.position.r) ? cart() : polar();
	}

	tick(){
		const { type, placement, tick } = this.props.state;
		const { show, css, dir, length, out, position, ds, color, width, custom, cs } = tick;

		if(show === false){
			return null;
		}
 
		const cart = () => {

			const x1 = toC(ds.x, position.x) - dir.x * length * out;
			const y1 = toC(ds.y, position.y) + dir.y * length * out; // beware about y sign!!
			const x2 = x1 + dir.x * length;
			const y2 = y1 - dir.y * length; // beware about y sign!!

			return {x1, x2, y1, y2};

		};

		const polar = () => {

			let _out = [];

			const r = toC(ds.r,position.r);
			const { dim } = this.props.state.grid;

			for(let i = 1; i < dim.length; i++){
				const theta = dim[i].theta;
				const x = r * Math.cos(theta);
				const y = r * Math.sin(theta);
				const x1 = x - length * out * Math.cos(theta);
				const y1 = y - length * out * Math.sin(theta);
				const x2 = x + length * out * Math.cos(theta);
				const y2 = y + length * out * Math.sin(theta);
				_out.push({x1,y1,x2,y2});
			}

			return _out;

		};

		const linePar = {
			stroke: color, 
			strokeWidth: width
		};

		const data = cs === 'polar' ? polar() : cart();

		const oneTick = ({x1,x2,y1,y2},key) => <line key={key} className={css ? `tick-${type} tick-${type}-${placement} ${this.props.className}` : ''} x1={x1} x2={x2} y1={y1} y2={y2} {...linePar}/>;


		const theTick = () => Array.isArray(data) ? data.map( (t,i) => oneTick(t,`polar.tick.${position.r}.${i}`)) : oneTick(data);

		return custom ? <g transform={`translate(${data.x2} ${data.y1})`}>{custom()}</g> : theTick();
	}

	label(){

		const noPrint = () => !isNil(this.props.state.tick.position.r) && this.props.state.tick.position.r < 1e-15; // no origin for radar

		if(this.props.state.label.show === false || noPrint()){
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
