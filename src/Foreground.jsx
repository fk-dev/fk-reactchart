import React from 'react';
import { isNil } from './core/utils.js';
import { toC, fromPic } from './core/space-transf.js';
import { isEqual } from './core/im-utils.js';

export default class Foreground extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	renderOne(state,ds,i){
		if(isNil(state.content ?? state.text)){
			return null;
		}

		const print = () => state.content ? state.content() : <text>{state.text}</text>;

		const wxc = isNil(state.x) ? isNil(state.ix) ? (state.cx - state.width / 2)  + this.props.pWidth / 2 : //pixels
			fromPic(ds.x, state.ix) : // implicit system
				toC(ds.x, state.x); // data space
		const wyc = isNil(state.y) ? isNil(state.iy) ? (state.cy + state.height / 2) + this.props.pHeight / 2 : //pixels
			fromPic(ds.y, state.iy) : // implicit
				toC(ds.y, state.y);
		const trans = 'translate(' + wxc + ',' + wyc + ')';
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
