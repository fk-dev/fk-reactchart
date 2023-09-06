import React from 'react';

import { isEqual } from './core/im-utils.js';

export default class Title extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){

    const { state } = this.props;
    const { width, height, titleFSize, title, css } = state;

		const xT = width / 2;
		const yT = height;
		const props = {fontSize: titleFSize};
		return title && title.length !== 0 ? <text textAnchor='middle' className={css ? 'title' : ''} {...props} x={xT} y={yT}>{title}</text> : null;
	}
}
