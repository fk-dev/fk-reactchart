import React from 'react';
import Label from './Label.jsx';
import { mgr as mgrUtil, direction, isNil, toNumber, deepCp } from '../core/utils.js';
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
		const { state, placement } = this.props;
		const { line } = state;
		const { css, color, width, CS, start, end } = line;

		const lp = {
			stroke: color,
			strokeWidth: width
		};

		switch(CS){
			case 'cart':
				return <line className={css ? `axis-line axis-line-${placement} ${this.props.className}` : ''} {...lp}
					x1={start.x} x2={end.x} y1={start.y} y2={end.y}/>;
			case 'polar':{
				return start.map( ({x, y},i) => <line key={`pol.${i}`} className={css ? `axis-line axis-line-${placement} ${this.props.className}` : ''} {...lp}
						x1={x} x2={end[i].x} y1={y} y2={end[i].y}/>
				);
			}default:
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

	label(){

		const { state, className, placement } = this.props;
		const { label } = state;

		const labName = `axis-label axis-label-${placement} ${className}Label`;
		if(this.props.state.line.CS === "polar"){
			return label.label.map( (lab,i) => {
				let cp = deepCp({},label);
				cp.label = lab;
				cp.position.theta = cp.position.theta[i];
				cp.offset = cp.offset[i];
				cp.anchor = cp.anchor[i];
				return <Label key={`polar.label.${lab}`} className={labName} state={cp}/>;
			});
		}else{
			return <Label className={labName} state={label}/>;
		}
	}

	render(){

		return this.props.state.show === false ? null : <g>
			{this.axis()}
			{this.factor()}
			{this.label()}
		</g>;
	}

}
