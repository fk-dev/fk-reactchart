import React from 'react';
import { isEqual } from './core/im-utils.js';

export default class Cadre extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.cadre,this.props.cadre);
	}

	render(){
		return <rect width={this.props.width} height={this.props.height} strokeWidth='1' stroke='black' fill='none' x='0' y='0'/>;
	}
}
