import { map, each, findWhere, reject, extend } from 'underscore';
import { isNil, mgr as typeMgr } from './utils.js';
import { shader } from './colorMgr.js';

// axis
import { vm as axisLineVM } from '../axis/axis-line-vm.js';
import { vm as ticksVM } from '../axis/tick-vm.js';

// charts
import { vm as plainVM }    from '../graphs/plain-vm.js';
import { vm as barChartVM } from '../graphs/bar-chart-vm.js';
import { vm as stairsVM }   from '../graphs/stairs-vm.js';
import { vm as pieVM }      from '../graphs/pie-vm.js';

// marks
import { vm as dotVM, 
				ovm as odotVM }    from '../marks/dot-vm.js';
import { vm as squareVM, 
				ovm as osquareVM } from '../marks/square-vm.js';
import { vm as barVM }     from '../marks/bar-vm.js';
// pin
import { vm as pinVM } from '../marks/pin.js';

// graph
const graphVM = {
	PLAIN:   plainVM,
	BARS:    barChartVM,
	YBARS:   barChartVM,
	STAIRS:  stairsVM,
	PIE:     pieVM
};

// marks
const marksVM = {
	OPENDOT:    odotVM,
	DOT:        dotVM,
	OPENSQUARE: osquareVM,
	SQUARE:     squareVM,
	BAR:        barVM
};

const curve = function(get, { spaces, serie, data, gprops, idx, css }){

			// 1 - find ds: {x: , y:}
			// common to everyone

			// we add the world
			// we find the proper x & y axis
			let xplace = 'bottom';
			if(!!data.abs && 
				!!data.abs.axis){
				xplace = data.abs.axis;
			}

			let yplace = 'left';
			if(!!data.ord && 
				!!data.ord.axis){
				yplace = data.ord.axis;
			}
			const ds = {
				x: spaces.x[xplace],
				y: spaces.y[yplace]
			};

			// 2 - line of graph
			const gtype = data.type || 'Plain';

			// positions are offsetted here
			const positions = map(serie, (point) => {

				const mgr = {
					x: typeMgr(point.x),
					y: typeMgr(point.y)
				};

				const offx = isNil(point.offset.x) ? 0 : point.offset.x;
				const offy = isNil(point.offset.y) ? 0 : point.offset.y;

				let out = {
					x: mgr.x.add(point.x,offx),
					y: mgr.y.add(point.y,offy),
					drop: {
						x: isNil(point.drop.x) ? null : mgr.x.add(point.drop.x,offx),
						y: isNil(point.drop.y) ? null : mgr.y.add(point.drop.y,offy),
					},
					span: point.span
				};

				for(let aa in point){
					switch(aa){
						case 'x':
						case 'y':
						case 'drop':
						case 'span':
						case 'offset':
							continue;
						default:
							out[aa] = point[aa];
					}
				}

				return out;

			});

			// 3 - points
			// we extend positions with any precisions done by the user,

			// first shader
			if(!isNil(gprops.shader)){
				shader(gprops.shader,positions);
			}

			// then explicit, takes precedence
			each(positions, (pos,idx) => {
				for(let u in data.series[idx]){
					switch(u){
						case 'x':
						case 'y':
						case 'drop':
						case 'span':
							continue;
						default:
							pos[u] = data.series[idx][u];
					}
				}
			});



			const isBar = (type) => type.search('Bars') >= 0 || type.search('bars') >= 0;

			const graphKey = gtype + '.' + idx;
			const mtype = isBar(gtype) ? 'bar' : gprops.markType || 'dot';
			const mprops = gprops.mark ? map(positions,(pos,idx) => {
				const markKey = `${graphKey}.${mtype[0]}.${idx}`;
				return {
					key: markKey,
					mark: marksVM[mtype.toUpperCase()].create(() => get().marks[idx], { position: pos, props: gprops, ds, motherCss: css}), 
					pin: pinVM.create(() => get().marks[idx], {pos, tag: gprops.tag, ds, motherCss: css, dir: gtype.startsWith('y') ? 'y' : 'x'}) 
				};
			}) : [];

			return {
				key: graphKey,
				type: gtype,
				path: gprops.onlyMarks && !isBar(gtype)? {show: false} : graphVM[gtype.toUpperCase()].create(() => get().path, { serie: positions, props: gprops, ds, motherCss: css }),
				markType: mtype,
				marks: mprops,
				show: gprops.show
			};
};

const axis = function(props,state,measurer,axe,dir, motherCss){

	const partnerAxe = axe === 'abs' ? 'ord' : 'abs';
	const othdir = dir === 'x' ? 'y' : 'x';

	// for every abscissa
	const out = map(state.spaces[dir], (ds,key) => {

		if(isNil(ds)){
			return null;
		}

		const find = (key) => {
			switch(key){
				case 'top':
				case 'right':
					return 'max';
				default:
					return 'min';
			}
		};

		const axisKey = axe + '.' + key;

		const axisProps = findWhere(props.axisProps[axe], {placement: key});
		const css = isNil(axisProps.css) ? motherCss : axisProps.css;

		const partnerAxis = props.axisProps[partnerAxe][axisProps.partner];
		const partnerDs   = state.spaces[othdir][partnerAxis.placement];

		let DS = {};
		DS[dir] = ds;
		DS[othdir] = partnerDs;
		const mgr = typeMgr(partnerDs.d.max);
		const partner = {
			pos: partnerDs.d[find(key)],
			length: mgr.distance(partnerDs.d.max,partnerDs.d.min)
		};
		const bounds = {min: ds.d.min, max: ds.d.max};

		const { margins } = state.spaces;

		const ticks = ticksVM(css: { major: axisProps.ticks.major.css, minor: axisProps.ticks.minor.css }, measurer, DS, partner, bounds, dir, axisProps, axisProps.factor, axisKey, motherCss: css, axisProps.placement, margins);

		return {
			show: axisProps.show,
			placement: axisProps.placement,
			key: axisKey,
			axisLine: axisLineVM(ds,axisProps,partnerDs,dir, motherCss, measurer),
			ticks
		};
	});

	return reject(out, (val) => isNil(val));

};

export let cadreVM = {
	create: (get, props) => {
		return props;
	}
};

export let backgroundVM = {
	create: (get, { color, spaces, css, motherCss }) => {
		css = isNil(css) ? motherCss : css;
		
		return {
			color,
			css,
			spaceX:{
				min: Math.min.apply(null,map(spaces.x,(ds) => ds ? ds.c.min :  1e6 )),
				max: Math.max.apply(null,map(spaces.x,(ds) => ds ? ds.c.max : -1e6 ))
			},
			spaceY:{
				min: Math.min.apply(null,map(spaces.y,(ds) => ds ? ds.c.min : 1e6  )),
				max: Math.max.apply(null,map(spaces.y,(ds) => ds ? ds.c.max : -1e6 ))
			}
		};
	}
};

const defaultTo = (v,def) => isNil(v) ? def : v;

export const foregroundVM = {
	create: (get, { foreground, spaces }) => {
		if(isNil(foreground)){
			return null;
		}

		const fore = Array.isArray(foreground) ? foreground : [ foreground ];
		each(fore, f => {
			let { cx, cy, width, height } = f;
			cx     = defaultTo(cx,0);
			cy     = defaultTo(cy,0);
			width  = defaultTo(width,0);
			height = defaultTo(height,0);
			extend(f,{ cx, cy, width, height });
		});

		const { x, y } = spaces;
		const { bottom } = x;
		const { left }   = y;
		return {
			ds: {
				x: bottom,
				y: left
			},
			fore
		};
	}
};

export let titleVM = {
	create: (get, { title, titleFSize, css, motherCss, width, height, placement }) => {

		css = isNil(css) ? motherCss : css;

		return { title, titleFSize, width, height, placement, css };
	}
};

export let axesVM = {

	create: (get, { props, state, measurer, motherCss }) => {
		return {
			abs: axis(props,state,measurer,'abs','x', motherCss),
			ord: axis(props,state,measurer,'ord','y', motherCss)
		};
	}

};

export let curvesVM = {

	create: (get, { props, state }) => {

		const { spaces } = state;
		return map(state.series, (serie,idx) => {
			const data   = props.data[idx];
			const gprops = props.graphProps[idx];
      const { css } = props;
			return curve(() => get()[idx], { spaces, serie, data, gprops, idx, css });
		});
	}

};
