/*
 * Responsible for making the ds object:
 *
 * ds is { c : {min, max}, d: {min,max}}
 */
import { isNil, mgr as mgrU, isString, isArray, computeSquare } from './utils.js';
import { defMargins } from './proprieties.js';
import { errorMgr }   from './errorMgr.js';
import { radius }     from './polar-search.js';
import { toC }        from './space-transf.js';
import { precompute } from '../marks/pin.js';

/* universe is {width , height}, this
 * is the total size of the svg picture.
 * The goal here is to compute the
 * world, i.e. the printed area
 *
 *        width
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
 *                    ^
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
 *      40 px in the x dir (length of text).
 *  - we take a 10px margin on title and labels
 *  - bottom and right margin:
 *      - 20px + ({x,y}LabelFSize + 10 px) if a {x,y}Label is defined,
 *  - top and left margin:
 *      - 20px + ({x,y}LabelFSize + 10 px) if a {x,y}Label is defined,
 *  - top margin takes a titleFSize + 10px more if a title is defined
 *
 * Then the data space is extended to the inner margin values,
 * then the data space can be even more extended to reach round values.
 *
 *  datas: { bounds: {min, max}, mgr, 
 *
 *
 * the cs/ds correspondance is found with:
 *    universe - marginsO - marginsI = datas
 */
const space = function(where, universe, margins, bounds, tags, type){

  // the margins (outer)

    // compute the world
    // universe-world margins
    // min and max of coord space
    // margins between borders and axis

    let OMargin = {
      min: margins.minO,
      max: margins.maxO
    };

    // we have the world's corners
    // the transformation between data space and the world space is
    // given by data space scaled to (world size - inner margins) and
    // placed at (origin.x.x + inner x margin, origin.y.y - inner y margin)
    let min, max;
    let rmin, rmax;
    if(where === 'left' || where === 'right'){ // beware sign
      min = universe - OMargin.min;
      max = OMargin.max;
      rmin = min - margins.minI;
      rmax = max + margins.maxI;
    }else{
      min = OMargin.min;
      max = universe - OMargin.max;
      rmin = min + margins.minI;
      rmax = max - margins.maxI;
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
      bounds.min = mgrU(type).emptyBounds().min;
    }
    if(!isFinite(bounds.max) || isNil(bounds.max)){
      bounds.max = mgrU(type).emptyBounds().max;
    }
    const mgr = mgrU(bounds.min);

    // on augmente la distance totale
    const cRelMinMore = Math.abs( (cWorld.min - posCWorld.min) / (posCWorld.max - posCWorld.min) );
    const cRelMaxMore = Math.abs( (cWorld.max - posCWorld.max) / (posCWorld.max - posCWorld.min) );
    const dMinMore = mgr.multiply(mgr.distance(bounds.max,bounds.min),cRelMinMore);
    const dMaxMore = mgr.multiply(mgr.distance(bounds.max,bounds.min),cRelMaxMore);
    const dWorld = {
      min: bounds.forcedMin ? bounds.min : mgr.subtract(bounds.min, dMinMore),
      max: bounds.forcedMax ? bounds.max : mgr.add(bounds.max, dMaxMore)
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
    let cur = {
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

	/// tags
		if(tags.min.length || tags.max.length){
			//// definitions of function depending on axis
			const minActive = tags.min.length;
			const maxActive = tags.max.length;

			const check = (c,b) => b ? c : true;

			let doMin = (_tags) => Math.min.apply(null,_tags.map(tag => toC(cur,tag.pos) + tag.min));
			let doMax = (_tags) => Math.max.apply(null,_tags.map(tag => toC(cur,tag.pos) + tag.max));
			let checkBounds = (min,max) => check(min < cur.c.min,minActive) || check(max > cur.c.max,maxActive);
			let updateMin = min => min < cur.c.min ? cur.c.min - min : 0;
			let updateMax = max => max > cur.c.max ? max - cur.c.max : 0;

				// y axis is reversed in SVG
			if(where === 'left' || where === 'right'){
				doMin = (_tags) => Math.max.apply(null,_tags.map(tag => toC(cur,tag.pos) + tag.min));
				doMax = (_tags) => Math.min.apply(null,_tags.map(tag => toC(cur,tag.pos) + tag.max));
				checkBounds = (min,max) => check(min > cur.c.min,minActive) || check(max < cur.c.max,maxActive);
				updateMin = min => min > cur.c.min ? min - cur.c.min : 0;
				updateMax = max => max < cur.c.max ? cur.c.max - max : 0;
			}

			let minC = minActive ? doMin(tags.min) : 0;
			let maxC = maxActive ? doMax(tags.max) : 0;
			let loop = 0;

			// vertical is reversed

			while( checkBounds(minC,maxC) && loop < 5){
				margins.minI += minActive ? updateMin(minC) : 0;
				margins.maxI += maxActive ? updateMax(maxC) : 0;
				cur = space(where, universe, margins, bounds, {min: [], max: []}, type);
				loop++;
				minC = minActive ? doMin(tags.min) : 0;
				maxC = maxActive ? doMax(tags.max) : 0;
			}
		}

		return cur;

};

const computeOuterMargin = (where, limits, axis, measure, title ) => {

  measure = measure || {};
  const { measureText, lengthes } = measure;
  const cadratin = lengthes();
  const dir = where === 'r' ? 'r' : where === 'left' || where === 'right' ? 'y' : 'x';

  let { min , max } = limits;

  const mgr = mgrU(limits.min);

  const titleMeasure = () => {
    let titleLength = 0;
    if(title && title.title.length){
      const cN = 'title';
      const {width, height} = measureText(title.title, title.titleFSize, cN);
      const angle = title.titleRotate * Math.PI / 180;
      titleLength = Math.cos(angle) * height + Math.sin(angle) * width + cadratin.title;
    }
    return titleLength;
  };

  if(!axis){
    return titleMeasure();
  }
  const titleLength = titleMeasure();

  // empty graph
  if(!isFinite(min) || isNil(min)){
    min = mgr.value(0);
  }
  if(!isFinite(max) || isNil(max)){
    max = mgr.value(4);
  }

  let labelLength = 0;
  let tickLabelLength = 0;
// tick label
  // tick, outer part
  const tick = axis.ticks.major;
  const tickLength = tick.show ? tick.length * tick.out : 0;
  // cadratin
  // tickLabelLength
  // cadratin
  const cadMar = Math.max(cadratin.tickLabel[where]/2, 3);
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

    const labels = axis.empty ? [] : tickLabels && tickLabels.length ? tickLabels.map(x => x.label) : computeLabels();

    if(labels.length){
			// this is the axises label
			if(dir === 'r'){
				axis.marginOff = Math.max(cadMar , defMargins.outer.min);
				const cN = axis.css ? `axis-label-${where}` : '';
				const { labelFSize, dim } = axis;
				return {
					cadMar,
					title: titleLength ? cadratin.tickLabel[where] / 2 + titleLength : 0,
					labelLengthes: dim.map( ({label, theta}) => {
						return {
							theta: theta,
							labelLength: measureText(label, labelFSize, cN)
						};
					})
				};
			}else{
				const cn = css ? `label-major-${where}` : null;
				const { width, height } = measureText(labels,labelFSize, cn );
				const angle = axis.ticks.major.rotate * Math.PI/180;
				const square = computeSquare(angle,  width, height);
				tickLabelLength = dir === "y" ? square.width : square.height;

				axis.marginOff = Math.max(tickLength + tickLabelLength + cadMar , defMargins.outer.min);
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
    
  }


// axis label
  if(axis.label.length){
    const cN = axis.css ? `axis-label-${where}` : '';
    const { label, labelFSize, labelRotate } = axis;
    const {width, height} = measureText(label, labelFSize, cN);
    const angle = labelRotate * Math.PI / 180;
    labelLength = computeSquare(angle,width,height).height + cadratin.axisLabel[where] / 3;
  }

  return tickLength + cadMar + tickLabelLength + labelLength + ( titleLength ? cadratin.tickLabel[where] / 2 + titleLength : 0 );

};

const _filter = (datas,dir, user) => {

  const idx = datas.findIndex( a => a && a.series && a.series.length);
  const ex = idx !== -1 && !isNil(datas[idx].series[0][dir]) ? datas[idx].series[0][dir] : null;

  if(ex === null){
    return [];
  }

  const mm = mgrU(ex);
  const curType = mm.type;

  let min = isNil(user.min) ? ex : user.min;
  let max = isNil(user.max) ? ex : user.max;

  const checkType = v => {
    const type = mgrU(v).type;
    if(type !== curType){
      errorMgr(`Types of ${dir} is not consistent, I have ${curType} and ${type}`);
    }
  };

  const doMin = v => {
    if(!isNil(user.min)){
      return;
    }
    const _doMin = r => {
      if(mm.lowerThan(r,min)){
        min = r;
      }
    };

    return isArray(v) ? v.forEach(_doMin) : _doMin(v);
  };
  const doMax = v => {
    if(!isNil(user.max)){
      return;
    }
    const _doMax = r => {
      if(mm.greaterThan(r,max)){
        max = r;
      }
    };

    return isArray(v) ? v.forEach(_doMax) : _doMax(v);
  };

  if(isNil(user.min) || isNil(user.max)){
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
            val = val.map( v => v + loff);
          }else{
            val = mm.add(val,loff);
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
  }

	/// min max minimum distance
	/// absolute distance < eps || relative distance < eps
	const minLength = mm.divide(min,10);
	const eps = mm.smallestStep(); // double precision
	const absDist = mm.subtract(max,min);
	const relDist = mm.divide(absDist,min);
	const doMinLength = mm.lowerThan(relDist,eps) || mm.lowerThan(absDist,eps);
	if(doMinLength){
		min = mm.subtract(min,minLength);
		max = mm.add(max,minLength);
	}
  
  return { min, max, forcedMin: !isNil(user.min), forcedMax: !isNil(user.max) };

};

const measureTags = (tagProps, pos, tag, lengthMgr) => {

  const { measureText } = lengthMgr;
	const { width, height } = measureText(tag,tagProps.fontSize);

	const {anchor, ph, pl} = precompute(tagProps, tagProps.dir, pos);

	// see pin.js for details
	const offset = {
		x: pl.x + ph.x + ( anchor.left ? 3 : -3 ),
		y: - pl.y + ph.y + ( anchor.top ? 3 : anchor.bottom ? -3 : 0 )
	};

	return {
		hor: {
			pos: pos.x,
			min: offset.x - (anchor.right ? width : anchor.left ? 0  : width/2 ) - defMargins.inner.min,
			max: offset.x + (anchor.left  ? width : anchor.right ? 0 : width/2 ) + defMargins.inner.min
		},
		vert: {
			pos: pos.y,
			min: offset.y + (anchor.top    ? height : anchor.bottom ? 0 : 0.25 * height) + defMargins.inner.min, // depth
			max: offset.y - (anchor.bottom ? height : anchor.top    ? 0 : 0.75 * height) - defMargins.inner.min // line height
		},
		
	};

};


const _spaces = (universe, datas, axis, borders, titleProps, showTags, lengthMgr) => {

	/// ordering the data
  const ob = {right: 'ord', left: 'ord', top: 'abs', bottom: 'abs'};
  const getDir = w => w === 'right' || w === 'left' ? 'y' : 'x';

  const axises = {
    left:   axis.ord.find(x => x.placement === 'left'), 
    right:  axis.ord.find(x => x.placement === 'right'),
    top:    axis.abs.find(x => x.placement === 'top'),
    bottom: axis.abs.find(x => x.placement === 'bottom')
  };

  let limits = {};
  for(let w in ob){
    const dats = datas.filter( series => series[ob[w]] && series[ob[w]].axis === w);
    limits[w] = _filter(dats, getDir(w), {min: axises[w] ? axises[w].min : null, max: axises[w] ? axises[w].max : null} );
  }
  let type = {};
  datas.forEach(datum => ['abs','ord'].forEach( key => {
    const _type = datum[key] ? datum[key].type : 'number';
    const _who  = datum[key] ? datum[key].axis : key === 'abs' ? 'left' : 'bottom';
    type[_who] = _type;
  }));

	const { max } = Math;

	/// margins
  const margins = {
    left: {
      marginsI: isNil(borders.marginsI.left) ? defMargins.inner.left : borders.marginsI.left,
      marginsF: borders.marginsF.left || 0,
      marginsO: max(defMargins.outer.min, !isNil(borders.marginsO.left) ? borders.marginsO.left : computeOuterMargin('left', limits.left, axises.left, lengthMgr, null ) )
    },
    right: {
      marginsI: isNil(borders.marginsI.right) ? defMargins.inner.right : borders.marginsI.right,
      marginsF: borders.marginsF.right || 0,
      marginsO: max(defMargins.outer.min, !isNil(borders.marginsO.right) ? borders.marginsO.right : computeOuterMargin('right', limits.right, axises.right, lengthMgr, null) )
    },
    top: {
      marginsI: isNil(borders.marginsI.top) ? defMargins.inner.top : borders.marginsI.top,
      marginsF: borders.marginsF.top || 0,
      marginsO: max(defMargins.outer.min, !isNil(borders.marginsO.top) ? borders.marginsO.top : computeOuterMargin('top', limits.top, axises.top, lengthMgr, titleProps ) )
    },
    bottom: {
      marginsI: isNil(borders.marginsI.bottom) ? defMargins.inner.bottom : borders.marginsI.bottom,
      marginsF: borders.marginsF.bottom || 0,
      marginsO: max(defMargins.outer.min, !isNil(borders.marginsO.bottom) ? borders.marginsO.bottom : computeOuterMargin('bottom', limits.bottom, axises.bottom, lengthMgr, null ) )
    },
  };

	// tmp var for clarity
	const head = margins.top.marginsO    + margins.top.marginsF;
	const foot = margins.bottom.marginsO + margins.bottom.marginsF;
	const pre  = margins.left.marginsO   + margins.left.marginsF;
	const post = margins.right.marginsO  + margins.right.marginsF;

	const headi = margins.top.marginsI;
	const footi = margins.bottom.marginsI;
	const prei  = margins.left.marginsI;
	const posti = margins.right.marginsI;

	/// tags
	let tag = {left: {min: [], max: []}, right: {min: [], max: []}, top: {min: [], max: []}, bottom: {min: [], max: []}};
	for(let i = 0; i < datas.length; i++){
		if(!showTags[i]){
			continue;
		}
		const hor  = datas[i].abs.axis;
		const vert = datas[i].ord.axis;
		const tags = datas[i].series.map( p => measureTags(showTags[i],p, p.tag, lengthMgr)).filter(x => x);
		tag[hor]  = {
			min: isNil(borders.marginsI.left)  ? tag[hor].min.concat(tags.map(t => t.hor))  : [], 
			max: isNil(borders.marginsI.right) ? tag[hor].max.concat(tags.map(t => t.hor))  : [],
		};
		tag[vert] = {
			min: isNil(borders.marginsI.bottom) ? tag[vert].min.concat(tags.map(t => t.vert)) : [],
			max: isNil(borders.marginsI.top)    ? tag[vert].max.concat(tags.map(t => t.vert)) : []
		};
	}

  return {
    y: {
      left:  axises.left  ? space('left',  universe.height, {minO: foot, maxO: head, minI: footi, maxI: headi}, limits.left,  tag.left,  type.left )  : null,
      right: axises.right ? space('right', universe.height, {minO: foot, maxO: head, minI: footi, maxI: headi}, limits.right, tag.right, type.right ) : null
    },
    x: {
      top:    axises.top    ? space('top',    universe.width, {minO: pre, maxO: post, minI: prei, maxI: posti}, limits.top,    tag.top,    type.top )    : null,
      bottom: axises.bottom ? space('bottom', universe.width, {minO: pre, maxO: post, minI: prei, maxI: posti}, limits.bottom, tag.bottom, type.bottom ) : null
    },
    margins
  };

};

const _polarSpace = (universe, datas, axis, borders, titleProps, lengthMgr) => {

	const axisBounds = axis.polar.reduce( (memo,ax) => {
		const max = isNil(ax.max) || ( !isNil(memo.max) && memo.max > ax.max ) ? memo.max : ax.max;
		const min = isNil(ax.min) || ( !isNil(memo.min) && memo.min < ax.min ) ? memo.min : ax.min;
		return { max, min };
	}, {});

	const { max, min } = datas.reduce( (memo,v) => {
		const valueMin = Math.min.apply(null, v.series.map( vv => isNil(vv.r) ? vv.y : vv.r ));
		const valueMax = Math.max.apply(null, v.series.map( vv => isNil(vv.r) ? vv.y : vv.r ));
		return {
			max: !isNil(memo.max) && memo.max > valueMax ? memo.max: valueMax,
			min: !isNil(memo.min) && memo.min < valueMin ? memo.min: valueMin,
		};
	}, {});

	const { cadMar, title, labelLengthes } = computeOuterMargin('r', {min: 0, max }, axis.polar[0], lengthMgr, titleProps );
	const sol = radius(universe.width - 2 * (cadMar + axis.polar[0].marginOff), universe.height - 2 * (cadMar + axis.polar[0].marginOff) - title,labelLengthes);
	const marginsO = {
		left:   sol.outerMargins.left   + cadMar,
		right:  sol.outerMargins.right  + cadMar,
		top:    sol.outerMargins.top    + cadMar + title,
		bottom: sol.outerMargins.bottom + cadMar
	};

	const dWorld = {
		min: isNil(axisBounds.min) ? min : axisBounds.min, 
		max: isNil(axisBounds.max) ? max : axisBounds.max
	};

	const oriOffset = (w,u) => (u - w)/2;

	const cWorld = {
		min: 0, 
		max: sol.r,
		origin: {
			x: marginsO.left + sol.r/2 + oriOffset(marginsO.left + marginsO.right + sol.r, universe.width),
			y: marginsO.top  + sol.r/2 + oriOffset(marginsO.bottom + marginsO.top + sol.r, universe.height),
		}
	};

	// delta d / delta c
	const fromCtoD = (dWorld.max - dWorld.min) / cWorld.max;

	return {
		r: {
			r: {
				c: {
					min: cWorld.min,
					max: cWorld.max,
					origin: cWorld.origin
				},
				d: {
					min: dWorld.min,
					max: dWorld.max
				},
				d2c: 1 / fromCtoD,
				c2d: fromCtoD
			}
		},
    margins: {
			r: { 
				marginsI: 0,
				marginsF: 0,
				marginsO,
			}
		}
	};

};

export function spaces(cs, universe, datas, axis, borders, titleProps, showTags, lengthMgr){

	return cs === 'polar' ? _polarSpace(universe, datas, axis, borders, titleProps, lengthMgr) : _spaces(universe, datas, axis, borders, titleProps, showTags, lengthMgr);

}
