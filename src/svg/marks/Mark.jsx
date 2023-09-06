import React from 'react';

import Dot from './Dot.jsx';
import Bar from './Bar.jsx';
import Square from './Square.jsx';
import { renderText } from './label-text.jsx';

import { isEqual } from '../core/im-utils.js';

export default class Mark extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	render(){
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

	pin(pinS){
		const { gIdx, index } = this.props;
		const { pinColor, path, pinWidth, labelFS, labelAnc, color, css, baseline, anchor } = pinS;
		const fontSize = typeof labelFS === 'number' ? `${labelFS}pt` : labelFS;
		const pathProps = { strokeWidth: pinWidth, stroke: pinColor, fill: 'none'};
		const style = {
			alignmentBaseline: baseline
		};

		const textProps = {
			style,
			className: css ? `tag tag-${gIdx} tag-${gIdx}-${index}` : '',
			fontSize, 
			fill: color,
			x: pinS.xL,
			textAnchor: labelAnc,
			y: pinS.yL
		};
		const anc = anchor.top ? 'top' : anchor.bottom ? 'bottom' : 'else';

		return pinS.path ? <g>
			<path className={css ? `pin pin-${gIdx} pin-${gIdx}-${index}` : ''} {...pathProps} d={path}/>
			{renderText(textProps,pinS.label,anc)}
		</g> : 
		renderText(textProps,pinS.label,anc);
	}

	_render(){
		return this.props.state.pin ? <g>
			{this.mark(this.props.state.mark)}
			{this.pin(this.props.state.pin)}
		</g> : this.mark(this.props.state.mark);
	}
}
