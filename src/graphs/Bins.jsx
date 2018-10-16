import React from 'react';

import { toC, toCwidth } from '../core/space-transf.js';
import { isEqual } from '../core/im-utils.js';
import { isNil } from '../core/utils.js';

/*
	{
		ds: {
			x: {},
			y: {}
		},
		color: '',
		fill: '',
		width: ,
		stairs: '',
		positions: [{x: , y: , fill: ''}], // start or end
		drops: [{x: , y: }],
		dropLine: {
			x: true || false,
			y: true || false
		}
	}
*/


export default class Bins extends React.Component {
	
	shouldComponentUpdate(props) {
		return !isEqual(props.state,this.props.state);
	}

	bin(point,drop,delta,idx){

		const { state } = this.props;

		const p = {
			x: toC(state.ds.x,point.x),
			y: toC(state.ds.y,point.y),
		};

		const d = {
			x: toC(state.ds.x,drop.x),
			y: toC(state.ds.y,drop.y),
		};

		const del = toCwidth(state.ds.x,delta);

		let path = '';
		switch(state.stairs){
			case 'right': {
				const pr1 = `${p.x} ${d.y}`;
				const pr2 = `${p.x} ${p.y}`;
				const pr3 = `${p.x + del} ${p.y}`;
				const pr4 = `${p.x + del} ${d.y}`;
				path = `M ${pr1} L ${pr2} L ${pr3} L ${pr4}`;
				break;
			}
			case 'left':{
				const pl1 = `${p.x - del} ${d.y}`;
				const pl2 = `${p.x - del} ${p.y}`;
				const pl3 = `${p.x} ${p.y}`;
				const pl4 = `${p.x} ${d.y}`;
				path = `M ${pl1} L ${pl2} L ${pl3} L ${pl4}`;
				break;
			}
		}

		const color = point.fill || state.fill;
		const shade = state.shade || 1;

		return <path key={idx} d={path} strokeWidth={0} fill={color} opacity={shade}/>;
	}

	path(){

		const { state } = this.props;
		if(state.positions.length === 0){
			return null;
		}
		const { positions, ds, drops, color, width, css, fill, shade } = state;

		const coord = (idx,idy) => {
			idy = isNil(idy) ? idx : idy;
			return toC(ds.x,positions[idx].x) + ',' + toC(ds.y,positions[idy].y);
		};

		const dropy = (idx) => toC(ds.x,positions[idx].x) + ',' + toC(ds.y,drops[idx].y);

		const dropx = (idx) => toC(ds.x,drops[idx].x) + ',' + toC(ds.y,positions[idx].y);

		const Nd = state.positions.length;
		let data = '';
		const delta = state.positions.length > 1 ? toCwidth(ds.x,positions[1].x -  positions[0].x) : 10;
		switch(state.stairs){
			case 'right':
			// right stairs
				data = ( state.dropLine.y ? dropy(0) + ' ' : '' ) + coord(0);
				for(let i = 1; i < Nd; i++){
					data += ` ${coord(i,i-1)} ${coord(i)}`;
					if(state.dropLine.y){
						data += ` ${dropy(i)} ${coord(i)}`;
					}
					if(state.dropLine.x){
						data += ` ${dropx(i)} ${coord(i)}`;
					}
				}
				data += ` ${toC(ds.x,positions[Nd - 1].x) + delta},${toC(ds.y,positions[Nd - 1].y)}`; // point
				if(state.dropLine.y){
					data += ` ${toC(ds.x,positions[Nd - 1].x) + delta},${toC(ds.y,drops[Nd - 1].y)}`; // drop
				}
				break;
			case 'left':
				// left stairs
				if(state.dropLine.y){
					data += `${toC(ds.x,positions[0].x) - delta},${toC(ds.y,drops[0].y)}`; // drop
				}
				data += ` ${toC(ds.x,positions[0].x) - delta},${toC(ds.y,positions[0].y)}`; // point
				data += ` ${coord(0)}`;
				for(let i = 1; i < Nd; i++){
					if(state.dropLine.x){
						data += ` ${dropx(i - 1)} ${coord(i-1)}`;
					}
					if(state.dropLine.y){
						data += ` ${dropy(i - 1)} ${coord(i-1)}`;
					}
					data += ` ${coord(i-1,i)} ${coord(i)}`;
				}
				data += state.dropLine.y ? ` ${dropy(Nd - 1)}` : '';
				break;
			default:
					throw new Error('Stairs are either right or left');
		}

		const props = {
			stroke: color,
			strokeWidth: width,
			fill,
			opacity: shade
		};

		return <polyline className={css ? 'curve' : ''} points={data} {...props} />;

	}

	render(){

		const { state } = this.props;
		const delta = state.positions.length > 1 ? state.positions[1].x -  state.positions[0].x : 1;

		return <g>
			{state.positions.map( (pos,idx) => this.bin(pos,state.drops[idx],delta,idx))}
			{this.path()}
		</g>;
	}
}
