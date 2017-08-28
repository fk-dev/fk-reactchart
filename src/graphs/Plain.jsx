import React from 'react';
import Path  from './Path.jsx';
import Mark  from '../marks/Mark.jsx';
import { map } from 'underscore';
import { isEqual } from '../core/im-utils.js';

/*
	{
		path: Path,
		markType: '',
		marks: [Dot || Square]
	}
*/
export default class PlainChart extends React.Component {

	shouldComponentUpdate(props) {
		return !isEqual(props.state,this.props.state);
	}

	render(){
		let { state, css, gIdx } = this.props;
		let opts = { css, gIdx };
		let { marks, path, markType } = state;
		return marks.length === 0 ? <Path {...opts} state={path}/> : <g>
			<Path {...opts} state={path}/>
			{map(marks, (point) => <Mark key={point.key} {...opts} state={point} type={markType}/>)}
			</g>;
	}
}
