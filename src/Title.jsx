import React from 'react';

import { isEqual } from './core/im-utils.js';

export default class Title extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){
		let xT = this.props.state.width / 2;
		let yT = this.props.state.FSize + 5; // see defaults in space-mgr, its 10 px margin
		return (!!this.props.state.title && this.props.state.title.length !== 0) ? <text textAnchor='middle' fontSize={this.props.state.FSize} x={xT} y={yT}>{this.props.state.title}</text>:null;
	}
}
