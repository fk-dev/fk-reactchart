import React from 'react';
import { isNil } from './core/utils.js';
import { toC, fromPic } from './core/space-transf.js';
import { isEqual } from './core/im-utils.js';

export default class Foreground extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	toPixel(state,ds,point){
		const wxc = isNil(point.x) ? isNil(point.ix) ? (point.cx - state.width / 2)  + this.props.pWidth / 2 : //pixels
			fromPic(ds.x, point.ix) : // implicit system
				toC(ds.x, point.x); // data space
		const wyc = isNil(point.y) ? isNil(point.iy) ? (point.cy + state.height / 2) + this.props.pHeight / 2 : //pixels
			fromPic(ds.y, point.iy) : // implicit
				toC(ds.y, point.y);

		return {wxc, wyc};
	}

	renderText(state){
		const textOpts = state.textOptions || {};
		return <text {...textOpts}>{state.text}</text>;
	}

	renderLine(state,ds){

		let me = this;

		const line = state.line.points.map( point => {
			const { wxc, wyc } = me.toPixel(state,ds,point);
			return `${wxc},${wyc}`;
		});

		const path = `M ${line.join(' ')}`;

		const options = state.line.options ?? {};

		return <path {...options} d={path}/>;

	}

	renderOne(state,ds,i){
		if(isNil(state.content ?? state.text ?? state.line)){
			return null;
		}

		const print = () => state.content ? state.content() : 
			state.text ? this.renderText(state):
				this.renderLine(state,ds);

		const { wxc, wyc } = this.toPixel(state,ds,state);

		const trans = state.line ? '' : 'translate(' + wxc + ',' + wyc + ')';
		return <g key={`fore.${i}`} transform={trans}>{print()}</g>;
	}

	render(){
		const { state } = this.props;
		const renderAll = () => {
			let out = [];
			for(let i = 0; i < state.fore.length; i++){
				out.push(this.renderOne(state.fore[i], state.ds, i));
			}
			return out;
		};
		return <g className='foreground'>
			{renderAll()}
		</g>;
	}
}
