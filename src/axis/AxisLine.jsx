import React from 'react';
import Label from './Label.jsx';
import { mgr as mgrUtil, direction, isNil, toNumber } from '../core/utils.js';
import { isEqual } from '../core/im-utils.js';
import { defMargins } from '../core/proprieties.js';

/*
	{
		show: true || false,

	///// line part
		line: {
			CS: ''
			start: {x,y},
			end: {x, y},
			origin: {x,y},
			radius: {x, y},
			color: '',
			width:,
		},

	/// label part
		label: Label 

 /// common factor part
		comFac: {
			factor: ,
			offset: {x, y},
			FSize: ,
			anchor: '',
			color: ''
		}

	}

*/


export default class AxisLine extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	axis(){
		const lprops = this.props.state.line;
		const { placement } = this.props;
		const { css } = this.props.state;

		const lp = {
			stroke: lprops.color,
			strokeWidth: lprops.width
		};

		switch(lprops.CS){
			case 'cart':
				return <line className={css ? `axis-line axis-line-${placement} ${this.props.className}` : ''} {...lp}
					x1={lprops.start.x} x2={lprops.end.x} y1={lprops.start.y} y2={lprops.end.y}/>;
			case 'polar':
				return <ellipse className={css ? `axis-line axis-line-${placement} ${this.props.className}` : '' } {...lp}
					cx={lprops.origin.x} cy={lprops.origin.y} rx={lprops.radius.x} ry={lprops.radius.y}/>;
			default:
				throw new Error(`Unknown coordinate system: "${this.props.state.CS}"`);
		}
	}

	factor(){
		const { state, placement } = this.props;
		const { comFac, line, css } = state;
		const { factor, Fsize, offset, color, ds } = comFac;
		if(isNil(factor) || factor === 1){
			return null;
		}

		const dir = direction(line, ds);
		dir.x = Math.sqrt(dir.x / dir.line);
		dir.y = Math.sqrt(dir.y / dir.line);

		const mgr = mgrUtil(factor);
		const om = mgr.orderMag(factor);

		const labMar = defMargins.outer.label.bottom; // = top, left, right
		const width  = 5 * (3 + ( om > 100 ? 0.8 : om > 10 ? 0.5 : 0.2 )); // 5px for 10^(123)
		const height = Fsize;

		let off = {x: 0, y: 0};
		switch(dir.corner){
			case '01':
				off.x = - width;
				off.y = - height;
				break;
			case '11':
				off.x = width  * ( dir.y - dir.x) + dir.y * labMar;
				off.y = height * ( dir.y - dir.x) - dir.x * labMar - dir.y * labMar * 0.5;
				break;
			case '10':
				off.x = width;
				off.y = height + labMar;
		}
		const props = {
			x: offset.x + line.end.x + off.x,
			y: offset.y + line.end.y + off.y,
			fill: color,
			fontSize: typeof Fsize === 'number' ? `${Fsize}pt` : Fsize
		};

		return <text className={css ? `axis-factor axis-factor-${placement}` : ''} {...props}>
			<tspan textAnchor='end'>&#183;10</tspan>
			<tspan dy={-0.5 * toNumber(Fsize)} textAnchor='start'>{om}</tspan>
		</text>;
	}

	render(){

		const { className, placement } = this.props;
		const labName = `axis-label axis-label-${placement} ${className}Label`;

		return this.props.state.show === false ? null : <g>
			{this.axis()}
			{this.factor()}
			<Label className={labName} state={this.props.state.label}/>
		</g>;
	}

}
