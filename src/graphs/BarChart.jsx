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

class BarChart extends React.Component {

	shouldComponentUpdate(props) {
		return !isEqual(props.state,this.props.state);
	}

	render() {
		let { state, css, gIdx } = this.props;
		let opts = { css, gIdx };
		let { marks } = state;

		if(marks.length === 0){
			return null;
		}

		return <g>
			{map(marks, (bar) => <Mark {...opts} key={bar.key} state={bar} type='bar'/>)}
		</g>;
	}
}

module.exports = BarChart;
