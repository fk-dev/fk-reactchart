import { direction, isNil } from '../core/utils.js';
import { anchorFromAngle } from '../core/polar-utils.js';

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
		label: Label = {
			label: '',
			FSize: ,
			offset: {x, y},
			anchor: ''
			color: '',
			dir: {x, y}
		},

 /// common factor part
		comFac: {
			factor: ,
			offset: {x, y},
			FSize: ,
			anchor
		}
	}
*/

export function vm(ds,cs, props,partnerDs,dir, motherCss, measurer){

	//// general defs
	const { measureText } = measurer;
	const lengthOfText = (txt,fs) => measureText(txt,fs,css ? `axis-label-${props.placement} axis${dir}${props.placement}` : '');

	const { show } = props;

	const css = isNil(props.css) ? motherCss : props.css;

/*
		line: {
			CS: ''
			start: {x,y},
			end: {x, y},
			color: '',
			width:,
		},
*/

	let line = { css };

	const tmp = {
		color: true,
		width: true
	};

	const othdir = 'polar';
	line.CS = cs;
	const lines = props.dim.map( ({theta}) => {
		const x = ds.c.origin.x + ds.c.max * Math.cos(theta);
		const y = ds.c.origin.y + ds.c.max * Math.sin(theta);
		return {
			start: {
				x: ds.c.origin.x,
				y: ds.c.origin.y
			},
			end: { x, y }
		};
	});
	line.start = lines.map(x => x.start);
	line.end   = lines.map(x => x.end);

	for(let u in tmp){
		line[u] = props[u];
	}

/*
		label: {
			ds: {x:, y: },
			position: {x: , y:},
			label: '',
			FSize: ,
			offset: {x, y},
			anchor: '',
			color: '',
			dir
		},
*/

	const lineDir = direction(line);
	const labelSizes = props.dim.map(x => lengthOfText(x.label,props.labelFSize));
	let label = {
		cs,
		css,
		label: props.dim.map(x => x.label),
		FSize: props.labelFSize,
		LLength: labelSizes.map(x => x.width),
		LWidth: labelSizes.map(x => x.width),
		LHeight: labelSizes.map(x => x.height),
		LLineHeight: labelSizes.map(x => x.lineHeight),
		color: props.labelColor,
		dir: lineDir.map(({x, y, line}) => ({
			x: Math.sqrt(x / line),
			y: Math.sqrt(y / line)
		})),
		rotate: true,
		transform: false,
		howToRotate: 0
	};

	label.position = {
		x: line.end.map( ({x},i) => (x + line.start[i].x)/2),
		y: line.end.map( ({y},i) => (y + line.start[i].y)/2),
		r: ds.c.max,
		theta: props.dim.map(x => x.theta)
	};

	const anchorAndOff = label.position.theta.map(t => anchorFromAngle(2 * Math.PI - t,ds.c.max,false,true));

	label.offset = anchorAndOff.map( (aAo,i) => ({x: aAo.textOffset.x, y: aAo.textOffset.y(labelSizes[i].width,labelSizes[i].height)}));
	label.anchor = anchorAndOff.map( aAo => aAo.textAnchor);

	label.ds = {};
	label.ds[dir] = ds;
	label.ds[othdir] = partnerDs;
	label.angle = 0;

/*
		comFac: {
			factor: ,
			offset: {x, y},
			FSize: ,
			anchor: '',
			color: ''
		}
*/

	let fds = {};
	
	fds[dir]    = ds;
	fds[othdir] = partnerDs;

	let comFac = {
		css,
		factor:     props.factor,
		offset:     props.factorOffset,
		anchor:     props.factorAnchor,
		Fsize:	    props.factorFSize,
		color:	    props.factorColor,
		ds:         fds
	};


	return {
		show: show,
		line: line,
		label: label,
		comFac: comFac
	};

}
