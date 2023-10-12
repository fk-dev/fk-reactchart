import React from 'react';

import Dot from './Dot.jsx';
import Bar from './Bar.jsx';
import Square from './Square.jsx';
import Pin from './Pin.jsx';
//import { renderText } from './label-text.jsx';

import { isEqual } from '../core/im-utils.js';

export default class Mark extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	mark(){
		const { css, gIdx, type, index, state: { mark } } = this.props;
		const opts = {css, gIdx, index };
		switch(type){
			case 'square':
			case 'Square':
			case 'opensquare':
			case 'OpenSquare':
				return <Square {...opts} state={mark} />;
			case 'dot':
			case 'Dot':
			case 'opendot':
			case 'OpenDot':
				return <Dot {...opts} state={mark} />;
			case 'bar':
			case 'Bar':
				return <Bar {...opts} state={mark} />;
			default:
				throw new Error(`unrecognized mark type: "${this.props.type}"`);
		}
	}

	render(){
		const { gIdx, index, state: { pin } } = this.props;
		return pin ? <g>
			{this.mark()}
			<Pin gIdx={gIdx} index={index} state={pin}/>
		</g> : this.mark();
	}
}
