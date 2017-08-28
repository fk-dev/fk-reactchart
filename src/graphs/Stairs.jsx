import React from 'react';
import Bins from './Bins.jsx';
import Mark from '../marks/Mark.jsx';
import { map } from 'underscore';

import { isEqual } from '../core/im-utils.js';

/*
	{
		markType: '',
		marks: [Dot || Square],
		path: Bins 
	}
*/

export default class StairsChart extends React.Component {

	shouldComponentUpdate(props) {
		return !isEqual(props.state,this.props.state);
	}

	render(){
		let { state, css, gIdx } = this.props;
		let opts = { css, gIdx };
		let { marks, path, markType } = state;
		return marks.length === 0 ? <Bins {...opts} state={path} /> : <g>
			<Bins {...opts} state={path} />
			{map(marks, (point) => <Mark {...opts} key={point.key} state={point} type={markType}/>)}
			</g>;
	}
}
