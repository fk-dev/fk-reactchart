import React from 'react';
import Path  from './Path.jsx';
import Mark from '../marks/Mark.jsx';
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
		const { marks, css, path } = state;

		if(marks.length === 0){
			return null;
		}

		return <g className={ css ? 'barchart' : null }>
			<Path {...opts} state={path}/>
			{marks.map( (bar,i) => <Mark {...opts} index={i} key={bar.key} state={bar} type='bar'/>)}
		</g>;
	}
}
