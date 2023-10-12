import { direction, isNil } from '../core/utils.js';

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

	const othdir = dir === 'x' ? 'y' : 'x';
	line.CS = cs;
	line.start = {};
	line.start[dir] = ds.c.min;
	line.start[othdir] = props.placement === 'right' || props.placement === 'top' ?  partnerDs.c.max : partnerDs.c.min;
	line.end = {};
	line.end[dir] = ds.c.max;
	line.end[othdir] = line.start[othdir];

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
	let label = {
		cs,
		css,
		label: props.label,
		FSize: props.labelFSize,
		LLength: props.labelFSize * 2/3 * props.label.length,
		LHeight: props.labelFSize,
		color: props.labelColor,
		dir: {
			x: Math.sqrt(lineDir.x / lineDir.line),
			y: Math.sqrt(lineDir.y / lineDir.line)
		},
		rotate: true,
		transform: false,
		howToRotate: 0
	};

	label.position = {
		x: (line.end.x + line.start.x)/2,
		y: (line.end.y + line.start.y)/2
	};

	// & anchoring the text
	const { height, width, lineHeight } = lengthOfText(label.label,label.FSize);
	label.LWidth      = width;
	label.LHeight     = height;
	label.LLineHeight = lineHeight;

	const nLines = height / ( lineHeight || 1 );
		// multilines margin (middle is in the middle of the text box => 1. up to the top/bottom line, 2. add the font height/depth
	const multMar = (nLines - 1)/2 * lineHeight;
	const fd = 0.25 * lineHeight; // font depth, 25 %
	const fh = 0.75 * lineHeight; // font height, 75 %
	const defOff = props.marginOff;

	const placerCart = (pl) => {

		switch(pl){
			case 'top':
				return {
					x: 0,
					y: - fd - multMar - defOff
				};
			case 'bottom':
				return {
					x: 0,
					y: fh + multMar + defOff
				};
			case 'left':
				return {
					x: - defOff,
					y: 0
				};
			case 'right':
				return {
					x: defOff + height,
					y: 0
				};
			default:
				throw new Error('Where is this axis: ' + props.placement);
		}
	};

	const offsetLab = placerCart(props.placement);

	label.offset = Array.isArray(offsetLab) ? offsetLab.map( off => {
		return {
			x: off.x + props.labelOffset.x,
			y: off.y + props.labelOffset.y,
		};
	}) : {
		x: offsetLab.x + props.labelOffset.x,
		y: offsetLab.y + props.labelOffset.y
	};

	label.anchor = props.labelAnchor;

	label.ds = {};
	label.ds[dir] = ds;
	label.ds[othdir] = partnerDs;

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

