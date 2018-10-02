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

export function vm(css, measurer, ds, partner, bounds, dir, locProps, comFac, axisKey, motherCss, placement){

	//// general defs
	const { measureText, lengthes } = measurer;
	const cadratin = lengthes();
	const lengthOfText = (txt,fs) => measureText(txt,fs,`${dir}AxisTickLabel`);

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
	const ticksLabel = locProps.tickLabels;
	// do we want the minor ticks to be computed?
	// do we want the minor grid?
	const minor = (minProps.show === true || locProps.grid.minor.show === true);

	// to have absolute lengthes
	const toPixel = Math.abs(ds[dir].d2c);
	// small hack for smarter guess at number of ticks
	const height = dir === 'x' ? majProps.labelFSize : majProps.labelFSize * 2 / 3.5;

	const labelSquare = (txt,border) => {
		const { labelFSize, rotate } = majProps;
		if(txt){
			const { width, height } = lengthOfText(txt,labelFSize);
			const angle = rotate * Math.PI / 180;
			const sq = computeSquare(angle,width,height);
			const factor =  border && dir === 'y' ? 2/3.5 : 1;
			return (dir === 'x' ? sq.width : sq.height ) * factor;
		}else{
			return cadratin.tickLabel[locProps.placement];
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

	const majorLabelize = (ticks,idx, def) => {
		const prev = idx > 0 ? ticks[idx - 1].position : null;
		const next = idx < ticks.length - 1 ? ticks[idx + 1].position : null;
		return majProps.labelize(ticks[idx].position, prev, next) === false ? def : majProps.labelize(ticks[idx].position, prev, next);
	};
	const minorLabelize = (ticks,idx, def) => {
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

	const tickers = ticks(min, max, majStep, ticksLabel, majorLabelize, minor, minStep, minorLabelize, comFac, toPixel, height, labelSquare);

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
		let ticksProps = {css};
		let tmp = {
			show: true,
			color: true,
			length: true,
			out: true,
			width: true
		};

		for(let u in tmp){
			ticksProps[u] = isNil(tick[u]) ? p[u] : tick[u];
		}
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
			y: typeMgr(ticksProps.position.y)
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
			ds: ds,
			label:	p.labelize(tick.position, prevTick(idx), nextTick(idx)) === false ? tick.label : p.labelize(tick.position, prevTick(idx), nextTick(idx)),
			FSize:	p.labelFSize,
			color:	p.labelColor,
			rotate: false,
			angle:  p.rotate,
			transform: true,
			show: tick.showLabel || ticksProps.show,
			howToRotate: locProps.placement === 'top' ? -1 : locProps.placement === 'bottom' ? 1 : 0
		};
		labelProps.dir = {};
		labelProps.dir[dir] = locProps.placement === 'top' || locProps.placement === 'right' ? -1 : 1;
		labelProps.dir[othdir] = 0;
		labelProps.LLength = lengthOfText(labelProps.label, labelProps.FSize).width;

		const addPerp =  tick.minor ? 3.75 : 0;
		const perpOff = isNil(p.labelOffset.perp) ? tick.offset.perp : p.labelOffset.perp ;
		let offsetCspace = {
			x: p.labelOffset.x, 
			y: perpOff + addPerp + p.labelOffset.y 
		};

		const alOff = isNil(p.labelOffset.along) ? tick.offset.along : p.labelOffset.along;
		const offset = {
			x: labelProps.dir.x !== 0 ? alOff : 0,
			y: labelProps.dir.y !== 0 ? alOff : 0
		};

		// adding a little margin
		// & anchoring the text
		let fd = 0.25 * labelProps.FSize; // font depth, 25 %
		let fh = 0.75 * labelProps.FSize; // font height, 75 %
			// see space mgr
		let mar = p.labelFMargin || 0;
		let outTick = p.length * p.out;

		// know where you are, label rotation anchor handling
		const anchor = (() => {
			switch(locProps.placement){
				case 'top':
					return {
						anchor: p.rotate > 0 ? 'end' : p.rotate < 0 ? 'start' : 'middle',
						off: {
							x: 0,
							y: - fh - fd - mar - outTick
						}
					};
				case 'bottom':
					return {
						anchor: p.rotate > 0 ? 'start' : p.rotate < 0 ? 'end' : 'middle',
						off: {
							x: 0,
							y: fh + fd + mar + outTick
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
				default:
					throw new Error('Where is this axis: ' + locProps.placement);
			}
		})();
		labelProps.anchor = anchor.anchor;
		offsetCspace.x += anchor.off.x;
		offsetCspace.y += anchor.off.y;
		if(locProps.placement === 'left'){
			offsetCspace.x *= -1;
		}

		labelProps.position = {
			x: mgr.x.add(ticksProps.position.x,offset.x),
			y: mgr.y.add(ticksProps.position.y,offset.y)
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
			width: true
		};

		const cus = tick.grid || {};
		for(let u in tmp){
			gridProps[u] = isNil(cus[u]) ? pg[u] : cus[u];
		}
		gridProps.length = partner.length;

		const tickKey = axisKey + '.t.' + idx;
		return {
			placement,
			key: tickKey,
			tick: ticksProps,
			grid: gridProps,
			label: labelProps,
			type: tick.type
		};

	});
}
