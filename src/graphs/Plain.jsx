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
		const { state, css, gIdx } = this.props;
		const opts = { css, gIdx };
		const { marks, path, markType } = state;
		return marks.length === 0 ? <Path className='plain' {...opts} state={path}/> : <g className='plain'>
			<Path {...opts} state={path}/>
			{map(marks, (point,index) => <Mark key={point.key} index={index} {...opts} state={point} type={markType}/>)}
			</g>;
	}
}
