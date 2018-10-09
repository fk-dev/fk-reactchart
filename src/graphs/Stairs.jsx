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
		const { state, gIdx } = this.props;
		const opts = { gIdx };
		const { marks, path, markType, css } = state;
		return marks.length === 0 ? <Bins className={css ? 'stairs' : ''} {...opts} state={path} /> : <g className={css ? 'stairs' : ''}>
			<Bins {...opts} state={path} />
			{map(marks, (point) => <Mark {...opts} key={point.key} state={point} type={markType}/>)}
			</g>;
	}
}
