import React from 'react';

import { renderText } from './label-text.jsx';

import { isEqual } from '../core/im-utils.js';

export default class Pin extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
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

	render(){
		return this.props.state ? this.pin(this.props.state) : null;
	}
}
