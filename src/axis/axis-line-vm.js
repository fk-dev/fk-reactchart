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

	const othdir = dir === 'x' ? 'y' : dir === 'y' ? 'x' : 'polar';
	line.CS = cs;
		// cart
	if(cs === 'cart'){
		line.start = {};
		line.start[dir] = ds.c.min;
		line.start[othdir] = props.placement === 'right' || props.placement === 'top' ?  partnerDs.c.max : partnerDs.c.min;
		line.end = {};
		line.end[dir] = ds.c.max;
		line.end[othdir] = line.start[othdir];
		// polar
	}else{
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
	}

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
		label: cs === 'polar' ? props.dim.map(x => x.label) : props.label,
		FSize: props.labelFSize,
		LLength: props.labelFSize * 2/3 * props.label.length,
		LHeight: props.labelFSize,
		color: props.labelColor,
		dir: {
			x: Math.sqrt(lineDir.x / lineDir.line),
			y: Math.sqrt(lineDir.y / lineDir.line)
		},
		rotate: true,
		transform: false
	};

	label.position = {
		x: (line.end.x + line.start.x)/2,
		y: (line.end.y + line.start.y)/2,
		r: ds.c.max,
		theta: props.dim ? props.dim.map(x => x.theta) : null
	};

	// & anchoring the text
	const { height, width } = lengthOfText(label.label,label.FSize);
	label.LHeight = height;
	label.LLength = width;
	const defOff = props.marginOff;

	const placer = (pl) => {
		switch(pl){
			case 'top':
				return {
					x: 0,
					y: - height - defOff
				};
			case 'bottom':
				return {
					x: 0,
					y: height + defOff
				};
			case 'left':
				return {
					x: - defOff,
					y: 0
				};
			case 'right':
				return {
					x: height + defOff,
					y: 0
				};
			case 'r':
				return {
					x: height + defOff,
					y: 0
				};
			default:
				throw new Error('Where is this axis: ' + props.placement);
		}
	};

	const anchorer = pl => {
		switch(pl){
			case 'top':
			case 'bottom':
				return 'middle';
			case 'left':
			case 'r':
				return 'end';
			case 'right':
				return 'start';
			default:
				throw new Error('Where is this axis: ' + props.placement);
		}
	};

	const placeTheta = t => {
		const rad = a => a / 180 * Math.PI;
		const places = {
			right:  { inf: 0,         sup: rad(45), infS: rad(7*45)},
			bottom:    { inf: rad(45),   sup: rad(3*45)},
			left:   { inf: rad(3*45), sup: rad(5*45)},
			top: { inf: rad(5*45), sup: rad(7*45)}
		};

		for(let u in places){
			if(places[u].infS){
				if(places[u].infS <= t){
					return u;
				}
			}
			if(places[u].inf <= t && places[u].sup > t){
				return u;
			}
		}

		return 'r';
	};

	const offsetLab = cs === 'polar' ? label.position.theta.map( t => placer(placeTheta(t))) : placer(props.placement);

	label.offset = Array.isArray(offsetLab) ? offsetLab.map( off => {
		return {
			x: off.x + props.labelOffset.x,
			y: off.y + props.labelOffset.y,
		};
	}) : {
		x: offsetLab.x + props.labelOffset.x,
		y: offsetLab.y + props.labelOffset.y
	};

	label.anchor = cs === 'polar' ? label.position.theta.map(t => anchorer(placeTheta(t))) : props.labelAnchor;

	label.ds = {};
	label.ds[dir] = ds;
	label.ds[othdir] = partnerDs;
	if(cs === 'polar'){
		label.angle = 0;
	}

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
