import React from 'react';
import { isNil } from './core/utils.js';
import { toC, fromPic } from './core/space-transf.js';
import { isEqual } from './core/im-utils.js';

export default class Foreground extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){
		if(isNil(this.props.state.content)){
			return null;
		}
		let wxc = isNil(this.props.state.x) ? isNil(this.props.state.ix) ? (this.props.state.cx - this.props.state.width / 2)  + this.props.pWidth / 2 : //pixels
			fromPic(this.props.state.ds.x, this.props.state.ix) : // implicit system
				toC(this.props.state.ds.x, this.props.state.x); // data space
		let wyc = isNil(this.props.state.y) ? isNil(this.props.state.iy) ? (this.props.state.cy + this.props.state.height / 2) + this.props.pHeight / 2 : //pixels
			fromPic(this.props.state.ds.y, this.props.state.iy) : // implicit
				toC(this.props.state.ds.y, this.props.state.y);
		let trans = 'translate(' + wxc + ',' + wyc + ')';
		return <g transform={trans} {...this.props.state}>{this.props.state.content()}</g>;
	}
}
