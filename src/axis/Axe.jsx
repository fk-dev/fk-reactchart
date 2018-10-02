import React from 'react';
import Tick from './Tick.jsx';
import AxisLine from './AxisLine.jsx';
import { map } from 'underscore';
import { isEqual } from '../core/im-utils.js';

/*
	{
		axisLine: AxisLine,
		ticks: [Tick]
	}
*/

export default class Axe extends React.Component {
	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){

		const { state, className } = this.props;
		const { placement } = state;

		const axisName = `${className}Line`;
		const tickName = `${className}Tick`;

		return <g className={`axis axis-${placement}`}>
			<g className='ticks'>
				{ map(state.ticks, (tick) => <Tick className={tickName} key={tick.key} state={tick}/> ) }
			</g>
			<AxisLine placement={placement} className={axisName} state={state.axisLine}/>
		</g>;
	}
}
