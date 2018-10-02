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
		const { css, gIdx, type, index } = this.props;
		const opts = {css, gIdx, index };
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
				throw new Error(`unrecognized mark type: "${this.props.type}"`);
		}
	}

	pin(pinS){
		const { css, gIdx } = this.props;
		const { pinColor, path, width, labelFS, labelAnc, color } = pinS;
		const fontSize = typeof labelFS === 'number' ? `${labelFS}pt` : labelFS;
		const pathProps = { strokeWidth: width, stroke: pinColor, fill: 'none'};
		const textProps = { fontSize, fill: color } ;
		return pinS.path ? <g>
			<path className={css ? `pin pin-${gIdx}` : ''} {...pathProps} d={path}/>
			<text className={css ? `tag tag-${gIdx}` : ''} {...textProps} style={{textAnchor: labelAnc}} x={pinS.xL} y={pinS.yL}>{pinS.label}</text>
		</g> : 
		<text className={css ? `tag tag-${gIdx}` : ''} {...textProps} x={pinS.xL} y={pinS.yL}>{pinS.label}</text>;
	}

	render(){
		return this.props.state.pin ? <g>
			{this.mark(this.props.state.mark)}
			{this.pin(this.props.state.pin)}
		</g> : this.mark(this.props.state.mark);
	}
}
