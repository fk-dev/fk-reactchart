import React from 'react';
import Tick from './Tick.jsx';
import AxisLine from './AxisLine.jsx';
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

		const { css } = state;

		return <g className={css ? `axis axis-${placement}` : ''}>
			<AxisLine placement={placement} className={axisName} state={state.axisLine}/>
			<g className={ css ? 'ticks' : ''}>
				{ state.ticks.map( tick => <Tick className={tickName} key={tick.key} state={tick}/> ) }
			</g>
		</g>;
	}
}
