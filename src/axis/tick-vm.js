import { map } from 'underscore';
import { isNil, mgr as typeMgr } from '../core/utils.js';
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

export function vm(ds,partner, bounds, dir, locProps, comFac, axisKey){

	//// general defs

	let othdir = dir === 'x' ? 'y' : 'x';


	// min max of the axis
	let min  = bounds.min;
	let max  = bounds.max;

	// all ticks are computed along, we need to 
	// know for each tick which it is
	let majProps = locProps.ticks.major;
	let minProps = locProps.ticks.minor;
	let majGrid  = locProps.grid.major;
	let minGrid  = locProps.grid.minor;

	// do we have labels? Only majorTicks, and unique labels
	const unique = arr => {
		let out = [];
		for(let i = 0; i < arr.length; i++){
			const { coord, label } = arr[i];
			if(out.findIndex(w => w.coord === coord && w.label === label) === -1){
				out.push(arr[i]);
			}
		}
		return out;
	};
	const ticksLabel = unique(locProps.tickLabels);
	// do we want the minor ticks to be computed?
	// do we want the minor grid?
	let minor = (minProps.show === true || locProps.grid.minor.show === true);

	// to have absolute lengthes
	let toPixel = Math.abs(ds[dir].d2c);
		// cheat to treat height as if it's length
	let height = dir === 'x' ? majProps.labelFSize : majProps.labelFSize * 2 / 3.5;

	// step
	let majStep = majProps.step;
	let minStep = minProps.step;

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

	let tickers = ticks(min, max, majStep, ticksLabel, minor, minStep, comFac, toPixel, height);

	let prevTick = (idx) => idx > 0 ? tickers[idx - 1].position : null;
	let nextTick = (idx) => idx < tickers.length - 1 ? tickers[idx + 1].position : null;

	return locProps.empty ? [] : map(tickers, (tick,idx) => {
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
		let ticksProps = {};
		let p = tick.minor ? minProps : majProps;
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
		if(typeof p.labelize === 'string'){
			let lmgr = typeMgr(tick.position);
			let maxDist = ds[dir].d.max - ds[dir].d.min;
			p.labelize = lmgr.labelize(p.labelize, maxDist);
		}
		let labelProps = {
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


		let addPerp =  tick.minor ? 3.75 : 0;
		let perpOff = isNil(p.labelOffset.perp) ? tick.offset.perp : p.labelOffset.perp ;
		let offsetCspace = {
			x: p.labelOffset.x, 
			y: perpOff + addPerp + p.labelOffset.y 
		};

		let alOff = isNil(p.labelOffset.along) ? tick.offset.along : p.labelOffset.along;
		let offset = {
			x: labelProps.dir.x !== 0 ? alOff : 0,
			y: labelProps.dir.y !== 0 ? alOff : 0
		};

		// adding a little margin
		// & anchoring the text
		let fd = 0.25 * labelProps.FSize; // font depth, 25 %
		let fh = 0.75 * labelProps.FSize; // font height, 75 %
			// see space mgr
		let mar = p.labelFMargin;
		let outTick = p.length * p.out;

		// know where you are, label rotation anchor handling
		let anchor = (() => {
			switch(locProps.placement){
				case 'top':
					return {
						anchor: 'middle',
						off: {
							x: 0,
							y: - fh - fd - mar
						}
					};
				case 'bottom':
					return {
						anchor: 'middle',
						off: {
							x: 0,
							y: fh + fd + mar
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
			let gridProps = {};
			p = tick.extra ? tick.grid : tick.minor ? minGrid : majGrid;
			tmp = {
				show: true,
				color: true,
				width: true
			};

			let cus = tick.grid || {};
			for(let u in tmp){
				gridProps[u] = isNil(cus[u]) ? p[u] : cus[u];
			}
			gridProps.length = partner.length;

		let tickKey = axisKey + '.t.' + idx;
		return {
			key: tickKey,
			tick: ticksProps,
			grid: gridProps,
			label: labelProps
		};

	});
}
