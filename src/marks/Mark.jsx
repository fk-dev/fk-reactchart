import React from 'react';

import Dot from './Dot.jsx';
import Bar from './Bar.jsx';
import Square from './Square.jsx';

import { isEqual } from '../core/im-utils.js';

export default class Mark extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	mark(state){
		let { css, gIdx, type } = this.props;
		let opts = {css, gIdx };
		switch(type){
			case 'square':
			case 'Square':
			case 'opensquare':
			case 'OpenSquare':
				return <Square {...opts} state={state} />;
			case 'dot':
			case 'Dot':
			case 'opendot':
			case 'OpenDot':
				return <Dot {...opts} state={state} />;
			case 'bar':
			case 'Bar':
				return <Bar {...opts} state={state} />;
			default:
				throw new Error('unrecognized mark type: "' + this.props.type + '"');
		}
	}

	pin(pinS){
		let { css, gIdx } = this.props;
		let pathProps = css ? null : { strokeWidth: 1, stroke: pinS.pinColor, fill: 'none', d: pinS.path };
		let textProps = css ? null : { fontSize: pinS.labelFS, style: {textAnchor: pinS.labelAnc}, fill: pinS.color } ;
		return pinS.path ? <g>
			<path className={'pin pin-' + gIdx} {...pathProps}/>
			<text className={'tag tag-' + gIdx} {...textProps} x={pinS.xL} y={pinS.yL}>{pinS.label}</text>
		</g> : 
		<text className={'tag tag-' + gIdx} {...textProps} x={pinS.xL} y={pinS.yL}>{pinS.label}</text>;
	}

	render(){
		return this.props.state.pin ? <g>
			{this.mark(this.props.state.mark)}
			{this.pin(this.props.state.pin)}
		</g> : this.mark(this.props.state.mark);
	}
}
