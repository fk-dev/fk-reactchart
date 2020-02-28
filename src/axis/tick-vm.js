import { isNil, mgr as typeMgr, computeSquare } from '../core/utils.js';
import { ticks } from '../core/ticker.js';

/*
	{
		// long thin grey line
		grid: {
			show: true || false,
			color: '',
			length: ,
			width: 
		},

	// tick
		tick: {
			show: true || false,
			color: '',
			position: {x, y},
			ds: {x, y},
			length: ,
			dir: {x, y},
			width: ,
			out:
		},

	// tick label
		label: Label = {
			ds: {x:, y: },
			position: {x: , y:},
			label: '',
			FSize: ,
			offset: {x, y},
			anchor: '',
			color: '',
			dir: {x, y}
		}
	}
*/

export function vm({css, cs, measurer, ds, partner, bounds, dir, locProps, comFac, axisKey, motherCss, placement, margins}){

	//// general defs
	const { measureText, lengthes } = measurer;
	const cadratin = lengthes();
	const lengthOfText = (txt,fs) => measureText(txt,fs,css ? `label-major-${locProps.placement} ticksmajor${dir}${locProps.placement}` : '');
	const outerMargins = {
		min: dir === 'x' ? margins.left  : dir === 'y' ? margins.bottom : margins.r,
		max: dir === 'x' ? margins.right : dir === 'y' ? margins.top : margins.r,
	};

	const othdir = dir === 'x' ? 'y' : 'x';

	const majCss = isNil(css.major) ? motherCss : css.major;
	const minCss = isNil(css.minor) ? motherCss : css.minor;

	// min max of the axis
	const min  = bounds.min;
	const max  = bounds.max;

	// all ticks are computed along, we need to 
	// know for each tick which it is
	const majProps = locProps.ticks.major;
	const minProps = locProps.ticks.minor;
	const majGrid  = locProps.grid.major;
	const minGrid  = locProps.grid.minor;

	// do we have labels? Only majorTicks
	const ticksLabel = dir === 'r' && locProps.tickLabels.find(tl => tl.type === 'axis') ? null : locProps.tickLabels;
	// do we want the minor ticks to be computed?
	// do we want the minor grid?
	const minor = (minProps.show === true || locProps.grid.minor.show === true);

	// to have absolute lengthes
	const toPixel = Math.abs(ds[dir].d2c);
	// small hack for smarter guess at number of ticks
	const height = dir === 'x' ? majProps.labelFSize : majProps.labelFSize * 2 / 3.5;

	const labelSquare = (txt) => {
		const { labelFSize, rotate } = majProps;

		// taille de texte
		if(txt){

			const { width, height } = lengthOfText(txt,labelFSize);
			const angle = rotate * Math.PI / 180;
			const sq = computeSquare(angle,width,height);

			return dir === 'x' ? sq.width : sq.height ;

		// distance entre labels
		}else{
			// 0	=> 1
			// 45 => 0
			// 90 => 2/3.5
			// linear in between

			// angle => 1 : -180 < alpha < 180
			// angle => 2 : [ -180 ; -90 ] <=> [0 ; 90] // [90;180] <=> [-90;0]
			// angle => 3 : [ -90 ; 0 ] <=> [0 ; 90]
			let ang = rotate%360;
			if(ang > 180){
				ang -= 360;
			}
			if(Math.abs(ang) > 90){
				ang += 180;
			}
			ang = Math.abs(ang);

			// inverse for ordinate
			ang = dir === 'x' ? ang : 90 - ang;
			const factor = ang > 45 ? (90 - ang)/(90 - 45) * 2/3 : ang < 45 ? ang/45 : 0;
			return cadratin.tickLabel[locProps.placement] * factor;
		}
	};


	// step
	let majStep = majProps.step;
	let minStep = minProps.step;
	// labelize
		// transform here if needed the labelize fct
	['major','minor'].forEach( x => {
		let p = locProps.ticks[x];
		if(typeof p.labelize === 'string'){
			const lmgr = typeMgr(ds[dir].d.max);
			const maxDist = ds[dir].d.max - ds[dir].d.min;
			p.labelize = lmgr.labelize(p.labelize, maxDist);
		}
	});

	const majLabelize = (ticks,idx, def) => {
		const prev = idx > 0 ? ticks[idx - 1].position : null;
		const next = idx < ticks.length - 1 ? ticks[idx + 1].position : null;
		return majProps.labelize(ticks[idx].position, prev, next) === false ? def : majProps.labelize(ticks[idx].position, prev, next);
	};
	const minLabelize = (ticks,idx, def) => {
		const prev = idx > 0 ? ticks[idx - 1].position : null;
		const next = idx < ticks.length - 1 ? ticks[idx + 1].position : null;
		return minProps.labelize(ticks[idx].position, prev, next) === false ? def : minProps.labelize(ticks[idx].position, prev, next);
	};

	if(!isNil(locProps.interval)){
		if(!majStep){
			majStep = {};
		}
		if(!minStep){
			minStep = {};
		}

		majStep.offset = locProps.interval;
		minStep.offset = locProps.interval;
	}

	// spacing factor
	const { spacingFactor } = majProps;

	const tickers = ticks(min, max, majStep, ticksLabel, {majAuto: majProps.autoOffset, majLabelize, spaceFac: spacingFactor }, minor, minStep, { minAuto: minProps.autoOffset, minLabelize}, comFac, toPixel, height, labelSquare, outerMargins);

	const prevTick = (idx) => idx > 0 ? tickers[idx - 1].position : null;
	const nextTick = (idx) => idx < tickers.length - 1 ? tickers[idx + 1].position : null;

	return locProps.empty ? [] : tickers.map( (tick,idx) => {
/*
		tick: {
			show: true || false,
			color: '',
			position: {x, y},
			length: ,
			dir: {x, y},
			width: ,
			out:
		},
*/
		const p = tick.minor ? minProps : majProps;
		const css = tick.minor ? minCss : majCss;
		let ticksProps = {css, cs};
		let tmp = {
			show: true,
			color: true,
			length: true,
			out: true,
			width: true,
			custom: locProps.custom
		};

		for(let u in tmp){
			ticksProps[u] = isNil(tick[u]) ? p[u] : tick[u];
		}
		ticksProps.show = tick.type.startsWith('borders-') ? false : ticksProps.show;
		ticksProps.position = {};
		ticksProps.position[dir] = tick.position;
		ticksProps.position[othdir] = partner.pos;
		ticksProps.ds = ds;

		ticksProps.dir = {};
		ticksProps.dir[dir] = 0;
		ticksProps.dir[othdir] =	locProps.placement === 'right' || locProps.placement === 'top' ? -1 : 1;

		if(tick.extra){
			ticksProps.show = tick.show;
		}

		let mgr = {
			x: typeMgr(ticksProps.position.x),
			y: typeMgr(ticksProps.position.y),
			r: typeMgr(ticksProps.position.r)
		};

/*
		label: Label = {
			ds: {x:, y: },
			position: {x: , y:},
			label: '',
			FSize: ,
			offset: {x, y},
			anchor: '',
			color: '',
			dir: {x, y}
		}
*/

		// label
		let labelProps = {
			css,
			cs,
			ds: ds,
			label:	p.labelize(tick.position, prevTick(idx), nextTick(idx)) === false ? tick.label : p.labelize(tick.position, prevTick(idx), nextTick(idx)),
			FSize:	p.labelFSize,
			color:	p.labelColor,
			rotate: false,
			angle:	p.rotate,
			transform: true,
			show: isNil(tick.showLabel) ? ticksProps.show : tick.showLabel,
			howToRotate: locProps.placement === 'top' ? -1 : locProps.placement === 'bottom' ? 1 : 0
		};
		const labelLenthes = lengthOfText(labelProps.label, labelProps.FSize);
		labelProps.dir = {};
		labelProps.dir[dir] = locProps.placement === 'top' || locProps.placement === 'right' ? -1 : 1;
		labelProps.dir[othdir] = 0;
		labelProps.LLength = labelLenthes.width;
		labelProps.LHeight = labelLenthes.height;
		labelProps.LLineHeight = labelLenthes.lineHeight;

		const addPerp =  tick.minor ? 3.75 : 0;
		const perpOff = isNil(p.labelOffset.perp) ? tick.offset.perp : p.labelOffset.perp ;
		let offsetCspace = {
			x: p.labelOffset.x, 
			y: perpOff + addPerp + p.labelOffset.y 
		};

		const alOff = isNil(p.labelOffset.along) ? tick.offset.along : p.labelOffset.along;
		const offset = {
			x: labelProps.dir.x !== 0 ? alOff : 0,
			y: labelProps.dir.y !== 0 ? alOff : 0,
			r: 0
		};

		// adding a little margin
		// & anchoring the text
		
		const { height, lineHeight } = labelLenthes;
		const nLines = height / ( lineHeight || 1 );
			// multilines margin (middle is in the middle of the text box => 1. up to the top/bottom line, 2. add the font height/depth
		const multMar = (nLines - 1)/2 * lineHeight;
		const fd = 0.25 * lineHeight; // font depth, 25 %
		const fh = 0.75 * lineHeight; // font height, 75 %
			// see space mgr
		const mar = isNil(p.labelFMargin) ? cadratin.tickLabel[locProps.placement] / 2 : p.labelFMargin;
		const outTick = p.length * p.out;

		// know where you are, label rotation anchor handling
		const anchorFromPlacement = placement => {

			//const placeFromTheta = t => t < Math.PI/2 ? 'left' : 'right';

			switch(placement){
				case 'top':
					return {
						anchor: p.rotate > 0 ? 'end' : p.rotate < 0 ? 'start' : 'middle',
						off: {
							x: 0,
							y: - mar - outTick - multMar
						}
					};
				case 'bottom':
					return {
						anchor: p.rotate > 0 ? 'start' : p.rotate < 0 ? 'end' : 'middle',
						off: {
							x: 0,
							y: ( p.rotate !== 0 ? Math.abs(Math.sin(p.rotate * Math.PI / 180) ) * height : fh + multMar ) + outTick + mar
						}
					};
				case 'left':
					return {
						anchor: 'end',
						off: {
							x: outTick + mar,
							y: fd
						}
					};
				case 'right':
					return {
						anchor: 'start',
						off: {
							x: outTick + mar,
							y: fd
						}
					};
				case 'r':
					return anchorFromPlacement('right');//placeFromTheta(locProps.dim[tick.position].theta)); 
				default:
					throw new Error('Where is this axis: ' + locProps.placement);
			}
		};

		const anchor = anchorFromPlacement(locProps.placement);
		labelProps.anchor = anchor.anchor;
		offsetCspace.x += anchor.off.x;
		offsetCspace.y += anchor.off.y;
		if(locProps.placement === 'left'){
			offsetCspace.x *= -1;
		}

		const isCart = isNil(ticksProps.position.r);
		labelProps.position = {
			x: isCart  ? mgr.x.add(ticksProps.position.x,offset.x) : null,
			y: isCart  ? mgr.y.add(ticksProps.position.y,offset.y) : null,
			r: !isCart ? mgr.r.add(ticksProps.position.r,offset.r) : null,
			theta: !isCart ? - Math.PI/2 : null
		};

		labelProps.offset = offsetCspace;

/*
		grid: {
			show: true || false,
			color: '',
			length: ,
			width: 
		},
*/
		let gridProps = {css};
		const pg = tick.extra ? tick.grid : tick.minor ? minGrid : majGrid;
		tmp = {
			show: true,
			color: true,
			width: true,
			circle: true,
			dim: true
		};

		const cus = tick.grid || {};
		for(let u in tmp){
			gridProps[u] = isNil(cus[u]) ? pg[u] : cus[u];
		}
		gridProps.length = partner.length;
		gridProps.show = tick.type.startsWith('borders-') && isNil(ticksProps.position.r) ? false : gridProps.show;

		const tickKey = axisKey + '.t.' + idx;
		return {
			placement,
			key: tickKey,
			tick: ticksProps,
			grid: gridProps,
			label: labelProps,
			type: tick.type.startsWith('borders-') ? tick.type.substring(8) : tick.type
		};

	});
}
