import React from 'react';
import { isEqual } from './core/im-utils.js';

export default class Cadre extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.width,this.props.width) || !isEqual(props.height,this.props.height);
	}

	render(){
		const { state } = this.props;
		const { css, width, height } = state;
		const props = {
			strokeWidth: 1,
			stroke: 'black' 
		};

		return <rect className={css ? 'cadre' : ''} x='0' y='0' fill='none' width={width} height={height} {...props}/>;
	}
}
