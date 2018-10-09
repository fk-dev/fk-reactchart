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

		let { state, className, css } = this.props;

		let axisName = className + 'Line';
		let tickName = className + 'Tick';

		return <g>
			{ map(state.ticks, (tick) => <Tick className={tickName} css={css} key={tick.key} state={tick}/> ) }
			<AxisLine className={axisName} css={css} state={state.axisLine}/>
		</g>;
	}
}
