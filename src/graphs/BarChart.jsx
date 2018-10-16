import React from 'react';
import Mark from '../marks/Mark.jsx';
import { map } from 'underscore';
import { isEqual } from '../core/im-utils.js';

/*
	{
		markType: 'bar'
		marks: [Bar]
	}
*/

export default class BarChart extends React.Component {

	shouldComponentUpdate(props) {
		return !isEqual(props.state,this.props.state);
	}

	render() {
		const { state, gIdx } = this.props;
		const opts = { gIdx };
		const { marks, path } = state;

		const { css } = path;

		if(marks.length === 0){
			return null;
		}

		return <g className={ css ? 'barchart' : null }>
			{map(marks, (bar,i) => <Mark {...opts} index={i} key={bar.key} state={bar} type='bar'/>)}
		</g>;
	}
}
