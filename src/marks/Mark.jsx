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
		const { gIdx, index } = this.props;
		const { pinColor, path, pinWidth, labelFS, labelAnc, color, css, baseline } = pinS;
		const fontSize = typeof labelFS === 'number' ? `${labelFS}pt` : labelFS;
		const pathProps = { strokeWidth: pinWidth, stroke: pinColor, fill: 'none'};
		const textProps = { fontSize, fill: color } ;
		const style = {
			alignmentBaseline: baseline
		};
		return pinS.path ? <g>
			<path className={css ? `pin pin-${gIdx} pin-${gIdx}-${index}` : ''} {...pathProps} d={path}/>
			<text style={style} className={css ? `tag tag-${gIdx} tag-${gIdx}-${index}` : ''} {...textProps} textAnchor={labelAnc} x={pinS.xL} y={pinS.yL}>{pinS.label}</text>
		</g> : 
		<text style={style} className={css ? `tag tag-${gIdx} tag-${gIdx}-${index}` : ''} {...textProps} x={pinS.xL} textAnchor={labelAnc} y={pinS.yL}>{pinS.label}</text>;
	}

	render(){
		return this.props.state.pin ? <g>
			{this.mark(this.props.state.mark)}
			{this.pin(this.props.state.pin)}
		</g> : this.mark(this.props.state.mark);
	}
}
