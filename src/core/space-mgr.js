/*
 * Responsible for making the ds object:
 *
 * ds is { c : {min, max}, d: {min,max}}
 */
import { map } from 'underscore';
import { isNil, mgr as mgrU, isString, isArray, computeSquare } from './utils.js';
import { defMargins } from './proprieties.js';
import { errorMgr }   from './errorMgr.js';

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
const space = function(where, universe, margins, bounds, minVals){

		// quick utils
		const ifNil = (a,b) => isNil(a) ? b : a;

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
			min: margins[marginMap[where].min].marginsO ? margins[marginMap[where].min].marginsO : Math.max(defMargins.outer.min,minVals[marginMap[where].min]),
			max: margins[marginMap[where].max].marginsO ? margins[marginMap[where].max].marginsO : Math.max(defMargins.outer.min,minVals[marginMap[where].max])
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
		if(!isFinite(bounds.min) || isNil(bounds.min)){
			bounds.min = 0;
		}
		if(!isFinite(bounds.max) || isNil(bounds.max)){
			bounds.max = 4;
		}
		const mgr = mgrU(bounds.min);

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



const computeOuterMargin = (where, limits, axis, measure, title, minimumValues) => {

	measure = measure || {};
	const { measureText, lengthes } = measure;
	const cadratin = lengthes();
	const dir = where === 'left' || where === 'right' ? 'y' : 'x';
	const otherWhere = dir === 'x' ? ['left','right'] : ['top','bottom'];

	let { min , max } = limits;

	const mgr = mgrU(limits.min);

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
	if(!isFinite(min) || isNil(min)){
		min = mgr.value(0);
	}
	if(!isFinite(max) || isNil(max)){
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
		const { labelFSize, css } = axis.ticks.major;
		const { tickLabels } = axis;

		const computeLabels = () => {
			const step = mgr.divide(mgr.distance(min,max),10);
			let tickers = [min];
			for(let i = 0; i < 10; i++){
				const pos = tickers[tickers.length - 1];
				tickers.push(mgr.add(pos,step));
			}

			let { labelize } = axis.ticks.major;
			if(typeof labelize === 'string'){
				const maxDist = max - min;
				labelize = mgr.labelize(labelize, maxDist);
			}
			
			const prevTick = i => i > 0 ? tickers[i - 1] : null;
			const nextTick = i => i < tickers.length - 1 ? tickers[i + 1] : null;

			return tickers.map( (tick,idx) => labelize(tick, prevTick(idx), nextTick(idx)) === false ? mgr.label(tick,step,1) : labelize(tick, prevTick(idx), nextTick(idx)));
		};

		const labels = tickLabels && tickLabels.length ? tickLabels.map(x => x.label) : computeLabels();

		if(labels.length){
			const cn = css ? `${dir}AxisTickLabel` : null;
			const { width, height } = measureText(labels,labelFSize, cn );
			const angle = axis.ticks.major.rotate * Math.PI/180;
			const square = computeSquare(angle,  width, height);
			tickLabelLength = dir === "y" ? square.width : square.height;
			otherWhere.forEach( w => {
				const m = dir === "x" ? square.width : square.height;
				if(!minimumValues[w] || minimumValues[w] < m){
					minimumValues[w] = m;
				}
			});

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
		labelLength = computeSquare(angle,width,height).height + cadratin.axisLabel[where] / 3;
	}

	const titleLength = titleMeasure();
	return tickLength + cadMar + tickLabelLength + cadMar + labelLength + ( titleLength ? cadratin.tickLabel[where] / 2 + titleLength : 0 );

};

const _filter = (datas,dir) => {

	const ex = datas.length && datas[0].series.length && !isNil(datas[0].series[0][dir]) ? datas[0].series[0][dir] : null;

	if(ex === null){
		return [];
	}

	const mm = mgrU(ex);
	const curType = mm.type;

	let min = ex;
	let max = ex;

	const checkType = v => {
		const type = mgrU(v).type;
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
		const limOfIdx = dir === 'y' || isNil(loff) ? -1 : loff > 0 ? serie.series.length - 1: 0;
		serie.series.forEach( (point,idx) => {
			// if label
			if(isString(point[dir])){
				return idx;
			}
			let val = point[dir];
			checkType(val);

			// modifiers are span, drop and offset
			// offset changes the value
			if(!isNil(point.offset) && !isNil(point.offset[dir])){
				val = mm.add(val,point.offset[dir]);
			}
			// drop adds a value
			if(!isNil(point.drop) && !isNil(point.drop[dir])){
				val = [val];
				val.push(point.drop[dir]);
			}

			// span makes value into two values,
			// we do it three, to keep the ref value
			if(!isNil(point.span) && !isNil(point.span[dir])){
				// beware, do we have a drop?
				val = isArray(val) ? val : [val];
				val.push(mm.subtract(val[0],mm.divide(point.span[dir],2)));
				val.push(mm.add(val[0],mm.divide(point.span[dir],2)));
			}

			// limitOffset changes only one boundary
			if(limOfIdx === idx){
				if(isArray(val)){
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

	let minVals = {left: 0, right: 0, top: 0, bottom: 0};

	const margins = {
		left: {
			marginsI: borders.marginsI.left,
			marginsF: borders.marginsF.left,
			marginsO: borders.marginsO.left ? borders.marginsO.left : computeOuterMargin('left', limits.left, axises.left, lengthMgr,null, minVals)
		},
		right: {
			marginsI: borders.marginsI.right,
			marginsF: borders.marginsF.right,
			marginsO: borders.marginsO.right ? borders.marginsO.right : computeOuterMargin('right', limits.right, axises.right, lengthMgr,null,minVals)
		},
		top: {
			marginsI: borders.marginsI.top,
			marginsF: borders.marginsF.top,
			marginsO: borders.marginsO.top ? borders.marginsO.top : computeOuterMargin('top', limits.top, axises.top, lengthMgr, title, minVals)
		},
		bottom: {
			marginsI: borders.marginsI.bottom,
			marginsF: borders.marginsF.bottom,
			marginsO: borders.marginsO.bottom ? borders.marginsO.bottom : computeOuterMargin('bottom', limits.bottom, axises.bottom, lengthMgr,null, minVals)
		},
	};

	return {
		y: {
			left:  axises.left  ? space('left',  universe.height, margins, limits.left,  minVals)  : null,
			right: axises.right ? space('right', universe.height, margins, limits.right, minVals) : null
		},
		x: {
			top:    axises.top    ? space('top',    universe.width, margins, limits.top,    minVals)    : null,
			bottom: axises.bottom ? space('bottom', universe.width, margins, limits.bottom, minVals) : null
		}
	};

}
