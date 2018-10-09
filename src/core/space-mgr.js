/*
 * Responsible for making the ds object:
 *
 * ds is { c : {min, max}, d: {min,max}}
 */
import { map } from 'underscore';
import * as utils     from './utils.js';
import { defMargins } from './proprieties.js';
import { errorMgr }   from './errorMgr.js';
import { ticks }      from './ticker.js';

/* universe is {width , height}, this
 * is the total size of the svg picture.
 * The goal here is to compute the
 * world, i.e. the printed area
 *
 *				width
 * <------------------------>
 *  ________________________
 * |                        | ^
 * |   title/top axis       | |
 * |    ________________    | |
 * |   |                |   | |
 * |   |                |   | |
 * | 1 |                | 2 | |
 * |   |     WORLD      |   | | height
 * |   |                |   | |
 * |   |                |   | |
 * |   |________________|   | |
 * |                        | |
 * |   bottom axis          | |
 * |________________________| |
 *										^
 * 1 - left axis
 * 2 - right axis
 *
 *
 */

/*
 * We need to know some stuff to compute the margins:
 *
 *
 * title = {
 *  title: '', 
 *  titleFSize: 30
 * } if given
 *
 * universe = in coordinate space, length
 * 
 * borders = {
 *  axis: [{label: '', labelFSize: 15, placement: left}],
 *  marginsO: {l: 0,  r: 0}, 
 *  marginsI: {l: 10, r: 10},
 *  min: ,
 *  max:
 * } or
 * borders = {
 *  axis: [{label: '', labelFSize: 15, placement: bottom}],
 *  marginsO: {t: 0,  b: 0}, 
 *  marginsI: {t: 10, b: 10},
 *  min: ,
 *  max:
 * }
 *
 * marginsO is for the outer margin, it overrides any
 * computations of them du to title and axis definitions.
 * marginsI are the inner margins we add to the world to
 * have a more aesthetic view.
 *
 * If no marginsO are defined, here are the rules:
 *  - ticks and ticks labels are 20 px in the y dir (height of text),
 *			40 px in the x dir (length of text).
 *  - we take a 10px margin on title and labels
 *  - bottom and right margin:
 *			- 20px + ({x,y}LabelFSize + 10 px) if a {x,y}Label is defined,
 *  - top and left margin:
 *			- 20px + ({x,y}LabelFSize	+ 10 px) if a {x,y}Label is defined,
 *  - top margin takes a titleFSize + 10px more if a title is defined
 *
 * Then the data space is extended to the inner margin values,
 * then the data space can be even more extended to reach round values.
 *
 *	datas: { bounds: {min, max}, mgr, 
 *
 *
 * the cs/ds correspondance is found with:
 *    universe - marginsO - marginsI = datas
 */
const space = function(where, universe, margins, bounds){

		// quick utils
		const ifNil = (a,b) => utils.isNil(a) ? b : a;

		const _marginMap = {
			y: {
				min: 'bottom',
				max: 'top',
			},
			x: {
				min: 'left',
				max: 'right',
			}
		};

		const marginMap = {
			left:   _marginMap.y,
			right:  _marginMap.y,
			bottom: _marginMap.x,
			top:    _marginMap.x,
		};

	// the margins (outer)

		// compute the world
		// universe-world margins
		// min and max of coord space
		// margins between borders and axis

		let OMargin = {
			min: margins[marginMap[where].min].marginsO ? margins[marginMap[where].min].marginsO : defMargins.outer.min,
			max: margins[marginMap[where].max].marginsO ? margins[marginMap[where].max].marginsO : defMargins.outer.min
		};

		// we have the world's corners
		// the transformation between data space and the world space is
		// given by data space scaled to (world size - inner margins) and
		// placed at (origin.x.x + inner x margin, origin.y.y - inner y margin)
		let min, max;
		let rmin, rmax;
		if(where === 'left' || where === 'right'){ // beware sign
			min = universe - OMargin.min;
			max = OMargin.max + ifNil(margins.top.marginsF, 0);
			rmin = min - ifNil(margins.bottom.marginsI, defMargins.inner.bottom);
			rmax = max + ifNil(margins.top.marginsI,    defMargins.inner.top);
		}else{
			min = OMargin.min;
			max = universe - OMargin.max -  + ifNil(margins.right.marginsF,0);
			rmin = min + ifNil(margins.left.marginsI,  defMargins.inner.left);
			rmax = max - ifNil(margins.right.marginsI, defMargins.inner.right);
		}

		const cWorld = {
			min,
			max
		};
		const posCWorld = {
			min: rmin,
			max: rmax
		};

	// empty graph
		if(!isFinite(bounds.min) || utils.isNil(bounds.min)){
			bounds.min = 0;
		}
		if(!isFinite(bounds.max) || utils.isNil(bounds.max)){
			bounds.max = 4;
		}
		const mgr = utils.mgr(bounds.min);

		// on augmente la distance totale
		const cRelMinMore = Math.abs( (cWorld.min - posCWorld.min) / (posCWorld.max - posCWorld.min) );
		const cRelMaxMore = Math.abs( (cWorld.max - posCWorld.max) / (posCWorld.max - posCWorld.min) );
		const dMinMore = mgr.multiply(mgr.distance(bounds.max,bounds.min),cRelMinMore);
		const dMaxMore = mgr.multiply(mgr.distance(bounds.max,bounds.min),cRelMaxMore);
		const dWorld = {
			min: mgr.subtract(bounds.min, dMinMore),
			max: mgr.add(bounds.max, dMaxMore)
		};

		// on s'assure que ce sera toujours > 0, peu importe ce que dit l'user
		if(dWorld.min - dWorld.max === 0){
			dWorld.min = mgr.subtract(bounds.min, mgr.smallestStep());
			dWorld.max = mgr.add(bounds.max, mgr.smallestStep());
		}

/**
 * ds is { 
    c : {
      min, 
      max
    }, 
    d: {
      min,
      max
    }, 
    c2d , 
    d2c
  }
*/
		const fromCtoD = mgr.getValue( mgr.divide( mgr.distance( dWorld.max , dWorld.min ), cWorld.max - cWorld.min));
		return {
			c: {
				min: cWorld.min,
				max: cWorld.max,
			},
			d: {
				min: dWorld.min,
				max: dWorld.max,
			},
			d2c: 1 / fromCtoD,
			c2d: fromCtoD
		};

};



const computeOuterMargin = (where, limits, axis, measure, title) => {

	measure = measure || {};
	const { measureText, lengthes } = measure;
	const cadratin = lengthes();
	const dir = where === 'left' || where === 'right' ? 'y' : 'x';

	const computeWithAngle = (alpha, c, s) => Math.abs(Math.cos(alpha) * c) + Math.abs(Math.sin(alpha) * s);

	let { min , max } = limits;

	const mgr = utils.mgr(limits.min);

	const titleMeasure = () => {
		let titleLength = 0;
		if(title && title.title.length){
			const cN = 'titleChart';
			const {width, height} = measureText(title.title, title.fontSize, cN);
			const angle = title.angle * Math.PI / 180;
			titleLength = Math.cos(angle) * height + Math.sin(angle) * width + cadratin.title;
		}
		return titleLength;
	};

	if(!axis){
		return titleMeasure();
	}

	// empty graph
	if(!isFinite(min) || utils.isNil(min)){
		min = mgr.value(0);
	}
	if(!isFinite(max) || utils.isNil(max)){
		max = mgr.value(4);
	}

// tick label
	// tick, outer part
	const tick = axis.ticks.major;
	const tickLength = tick.show ? tick.length * tick.out : 0;
	// cadratin
	// tickLabelLength
	// cadratin
	let tickLabelLength = 0;
	const cadMar = cadratin.tickLabel[where]/3;
	if(axis){
		const { step, labelFSize } = axis.ticks.major;
		const { tickLabels } = axis;
		const tickers = ticks(min, max, step, tickLabels, false, null, 1, 1, 10);

		let { labelize } = axis.ticks.major;
		if(tickers.length){
			if(typeof labelize === 'string'){
				const maxDist = max - min;
				labelize = mgr.labelize(labelize, maxDist);
			}
			
			const prevTick = i => i > 0 ? tickers[i - 1] : null;
			const nextTick = i => i < tickers.length - 1 ? tickers[i + 1] : null;

			const labels  = tickers.map( (tick,idx) => labelize(tick.position, prevTick(idx), nextTick(idx)) === false ? tick.label : labelize(tick.position, prevTick(idx), nextTick(idx)));
			const cn = `${dir}AxisTickLabel`;
			const { width, height } = measureText(labels,labelFSize, cn );
			const angle = axis.ticks.major.rotate * Math.PI/180;
			tickLabelLength = computeWithAngle(angle,  dir === 'y'  ? width : height, dir === 'x'  ? width : height );

			axis.marginOff = Math.max(tickLength + tickLabelLength + 2 * cadMar, defMargins.outer.min);
			// offset for the label
			for(let ti in {major: true, minor: true}){
				const ticks = axis.ticks[ti];
				if(!ticks.show){
					continue;
				}
				ticks.labelFMargin =  cadMar / 2;
			}
		}
		
	}


// axis label

	let labelLength = 0;
	if(axis.label.length){
		const cN = `${dir}AxisLabel`;
		const { label, labelFontSize, labelRotate } = axis;
		const {width, height} = measureText(label, labelFontSize, cN);
		const angle = labelRotate * Math.PI / 180;
		labelLength = computeWithAngle(angle,height,width) + cadratin.axisLabel[where] / 3;
	}

	const titleLength = titleMeasure();
	return tickLength + cadMar + tickLabelLength + cadMar + labelLength + ( titleLength ? cadratin.tickLabel[where] / 2 + titleLength : 0 );

};

const _filter = (datas,dir) => {

	const ex = datas.length && datas[0].series.length && !utils.isNil(datas[0].series[0][dir]) ? datas[0].series[0][dir] : null;

	if(ex === null){
		return [];
	}

	const mm = utils.mgr(ex);
	const curType = mm.type;

	let min = ex;
	let max = ex;

	const checkType = v => {
		const type = utils.mgr(v).type;
		if(type !== curType){
			errorMgr(`Types of ${dir} is not consistent, I have ${curType} and ${type}`);
		}
	};

	const doMin = v => {
		const _doMin = r => {
			if(mm.lowerThan(r,min)){
				min = r;
			}
		};

		return Array.isArray(v) ? v.forEach(_doMin) : _doMin(v);
	};
	const doMax = v => {
		const _doMax = r => {
			if(mm.greaterThan(r,max)){
				max = r;
			}
		};

		return Array.isArray(v) ? v.forEach(_doMax) : _doMax(v);
	};

	datas.forEach( serie => {
		// global characteristics
		const loff = serie.limitOffset;
		const limOfIdx = dir === 'y' || utils.isNil(loff) ? -1 : loff > 0 ? serie.series.length - 1: 0;
		serie.series.forEach( (point,idx) => {
			// if label
			if(utils.isString(point[dir])){
				return idx;
			}
			let val = point[dir];
			checkType(val);

			// modifiers are span, drop and offset
			// offset changes the value
			if(!utils.isNil(point.offset) && !utils.isNil(point.offset[dir])){
				val = mm.add(val,point.offset[dir]);
			}
			// drop adds a value
			if(!utils.isNil(point.drop) && !utils.isNil(point.drop[dir])){
				val = [val];
				val.push(point.drop[dir]);
			}

			// span makes value into two values,
			// we do it three, to keep the ref value
			if(!utils.isNil(point.span) && !utils.isNil(point.span[dir])){
				// beware, do we have a drop?
				val = utils.isArray(val) ? val : [val];
				val.push(mm.subtract(val[0],mm.divide(point.span[dir],2)));
				val.push(mm.add(val[0],mm.divide(point.span[dir],2)));
			}

			// limitOffset changes only one boundary
			if(limOfIdx === idx){
				if(utils.isArray(val)){
					val = map(val, (v) => v + loff);
				}else{
					val += loff;
				}
			}

			doMax(val);
			doMin(val);
		});
		serie.phantomSeries.forEach( p => {
			doMax(p[dir]);
			doMin(p[dir]);
		});
	});
	
	return { min, max };

};

export function spaces(universe, datas, axis, borders, title, lengthMgr){

	const ob = {right: 'ord', left: 'ord', top: 'abs', bottom: 'abs'};
	const getDir = w => w === 'right' || w === 'left' ? 'y' : 'x';
	let dats = {};
	let limits = {};
	for(let w in ob){
		dats[w] = datas.filter( series => series[ob[w]] && series[ob[w]].axis === w);
		limits[w] = _filter(datas.filter( series => series[ob[w]] && series[ob[w]].axis === w), getDir(w) );
	}

	const axises = {
		left:   axis.ord.find(x => x.placement === 'left'),	
		right:  axis.ord.find(x => x.placement === 'right'),
		top:    axis.abs.find(x => x.placement === 'top'),
		bottom: axis.abs.find(x => x.placement === 'bottom')
	};

	const margins = {
		left: {
			marginsI: borders.marginsI.left,
			marginsF: borders.marginsF.left,
			marginsO: borders.marginsO.left ? borders.marginsO.left : computeOuterMargin('left', limits.left, axises.left, lengthMgr)
		},
		right: {
			marginsI: borders.marginsI.right,
			marginsF: borders.marginsF.right,
			marginsO: borders.marginsO.right ? borders.marginsO.right : computeOuterMargin('right', limits.right, axises.right, lengthMgr)
		},
		top: {
			marginsI: borders.marginsI.top,
			marginsF: borders.marginsF.top,
			marginsO: borders.marginsO.top ? borders.marginsO.top : computeOuterMargin('top', limits.top, axises.top, lengthMgr, title)
		},
		bottom: {
			marginsI: borders.marginsI.bottom,
			marginsF: borders.marginsF.bottom,
			marginsO: borders.marginsO.bottom ? borders.marginsO.bottom : computeOuterMargin('bottom', limits.bottom, axises.bottom, lengthMgr)
		},
	};

	return {
		y: {
			left:  axises.left  ? space('left',  universe.height, margins, limits.left)  : null,
			right: axises.right ? space('right', universe.height, margins, limits.right) : null
		},
		x: {
			top:    axises.top    ? space('top',    universe.width, margins, limits.top)    : null,
			bottom: axises.bottom ? space('bottom', universe.width, margins, limits.bottom) : null
		}
	};

/*
	// worlds = (l,b), (l,t), (r,b), (r,t)
	const rights  = boundaries('y', limits.right, axis.ord.find(x => x.placement === 'right'),  lengthMgr);
	const lefts   = boundaries('y', _filter(dats.left,   'y'), borders.ord.find(x => x.placement === 'left'),   lengthMgr);
	const tops    = boundaries('x', _filter(dats.top,    'x'), borders.abs.find(x => x.placement === 'top'),    lengthMgr);
	const bottoms = boundaries('x', _filter(dats.bottom, 'x'), borders.abs.find(x => x.placement === 'bottom'), lengthMgr);

	const left = {
		mgr: lefts.mgr,
		bounds: lefts.bounds,
		margin: {
			max: tops.labelLength,
			min: bottoms.labelLength
			}
	};
	const right = {
		mgr: rights.mgr,
		bounds: rights.bounds,
		margin: {
			max: tops.labelLength,
			min: bottoms.labelLength
		}
	};
	const top = {
		mgr: tops.mgr,
		bounds: tops.bounds,
		margin: {
			min: lefts.labelLength,
			max: rights.labelLength
		}
	};
	const bottom = {
		mgr: bottoms.mgr,
		bounds: bottoms.bounds,
		margin: {
			min: lefts.labelLength,
			max: rights.labelLength
		}
	};


	let border = {};
	border.ord = {
		marginsO: {top: borders.marginsO.top, bottom: borders.marginsO.bottom},
		marginsI: {top: borders.marginsI.top, bottom: borders.marginsI.bottom},
		marginsF: {top: borders.marginsF.top, bottom: borders.marginsF.bottom},
		labels:   {top: borders.labels.top,   bottom: borders.labels.bottom},
		axis: borders.abs
	};

	border.abs = {
		marginsO: {left: borders.marginsO.left, right: borders.marginsO.right},
		marginsI: {left: borders.marginsI.left, right: borders.marginsI.right},
		marginsF: {left: borders.marginsF.left, right: borders.marginsF.right},
		labels:   {left: borders.labels.left,   right: borders.labels.right},
		axis: borders.ord
	};

	let bor = {};
	for(let w in ob){
		// copy/expand
		bor[w] = extend(extend({},border[ob[w]]), {min: mins[w], max: maxs[w]});
	}

	return {
		y: {
			left:  space('left',  left,  universe.height, bor.left, title, cadratin),
			right: space('right', right, universe.height, bor.right,title, cadratin)
		}, 
		x: {
			bottom: space('bottom', bottom, universe.width, bor.bottom, null, cadratin),
			top:    space('top',    top,    universe.width, bor.top,    null, cadratin)
		}
	};
*/
}
