import React from 'react';

import { isEqual } from './core/im-utils.js';

export default class Title extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){

    const { state, css } = this.props;
    const { width, titleFSize, title } = state;

		const xT = width / 2;
		const yT = titleFSize + 5; // see defaults in space-mgr, its 10 px margin
		const props = css ? {} : {fontSize: titleFSize};
		const cN = css ? 'titleChart' : '';
		return title && title.length !== 0 ? <text textAnchor='middle' className={cN} {...props} x={xT} y={yT}>{title}</text> : null;
	}
}
