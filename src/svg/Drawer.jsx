import React from 'react';
import Axes from './Axes.jsx';
import { grapher } from './graphs/grapher.jsx';
import Cadre from './Cadre.jsx';
import Background from './Background.jsx';
import Foreground from './Foreground.jsx';
import Title from './Title.jsx';
import Measurer from './Measurer.jsx';
import Gradienter from './Gradienter.jsx';
import Waiting from './Waiting.jsx';

import { isEqual } from './core/im-utils.js';
import { toC,toD } from './core/space-transf.js';

/*
	{
		width: ,
		height: ,
		cadre: Cadre,
		background: Background,
		title: Title,
		axes: Axes,
		curves: Curves,
		foreground: Foreground
	}
*/
function hoverLabelData(curve,mouseX){
		curve = curve.toJS ? curve.toJS() : curve;
		let curveParams = curve.type === 'Plain' ? curve.path : curve.type === 'Bars' ? curve.marks[0]?.mark : null;
		if(!curveParams){
			return null;
		}
		const dsx = curveParams.ds?.x;
		const dsy = curveParams.ds?.y;
		const dataX =  toD(dsx,mouseX);
		const positions = curve.type === 'Plain' ? curve.path.positions: curve.type === 'Bars' ? curve.marks.map(m=>m.mark.position):curve.type === 'Pie' ?  curve.path.positions.map(p=>({x:p.color,y:p.value})):[];
		if(!positions.length){
			return null;
		}
		const data = positions.reduce(function(prev, curr, i) {
			return Math.abs(curr.x - dataX) < Math.abs(prev.x - dataX) ? {x: curr.x, y: curr.y, ii: i} : {x: prev.x, y: prev.y, ii: prev.ii ?? 0};
		});
		data.cx = toC(dsx,data.x);
		data.cy = toC(dsy,data.y);
		//curvedata to y => label in x,y position
		// const axes = this.props.state.axes;
		const labelX = mouseX;
		let labelY;
	
		labelY = toC(dsy,data.y);
		
	return {labelX,labelY, ...data};
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

export default class Drawer extends React.Component {

	constructor(props) {
    super(props);
    this.state = {
			outOfGraph: null,
			dataPoints: [],
			maxX: -1,
			width: -1,
			height: -1
		};
  }

	shouldComponentUpdate(props){
		return props.interactive || !isEqual(props.state,this.props.state) || props.className !== this.props.className;
	}

	measureTt(tt){
		if(!tt || !this.graphRef){return;}
		const { width, height } = tt.getBoundingClientRect();
		if(this.state.maxX < 0 || this.state.width < 0 || this.state.width < width){
			const maxW = this.graphRef.getBoundingClientRect().width;
			this.setState({maxX: maxW - width, width});
		}
		if(!this.state.yOffset || this.state.height < 0 || height !== this.state.height){
			this.setState({yOffset: 50 - height/2, height});
		}
	}

	handleMouseMove = (event) => {
		if(!this.props.state.mouseDataHighlightSupported  || this.state.outOfGraph){
			return;
		}
	
		const parentElement = this.graphRef;
		let pt = parentElement.createSVGPoint();
		pt.x = event.clientX; pt.y = event.clientY;
		// console.log("check : ",parentElement.getScreenCTM());
		const screenCTM = parentElement.getScreenCTM()
		const res = pt.matrixTransform(screenCTM.inverse());
		const x = res.x;
    	const y = res.y;
		const dataPoints = this.props.state.curves.filter(c => c.show && [/*'Bars',*/'Plain'].includes(c.type)).map(c => hoverLabelData(c,x));
		/// first set of outOfGraph, we don't know where we are
		if(this.state.outOfGraph === null){
			const { width, height } = this.graphRef.getBoundingClientRect();
			const outX = x < 0 || x > width;
			const outY = y < 0 || y > height;
			this.setState({outOfGraph: outX || outY});
		}

		this.setState({ x, y, originalX: pt.x, dataPoints });
	}

	handleMouseOut = () => {
		if(this.props.interactive){
			this.setState({ outOfGraph:true });
		}
	}

	handleMouseIn = () => {
		if(this.props.interactive){
			this.setState({ outOfGraph:false });
		}
	}

	componentDidMount(){
		window.document.addEventListener('mousemove',this.handleMouseMove);

	}
	componentWillUnmount(){
		window.document.removeEventListener('mousemove',this.handleMouseMove);
	}

	componentDidUpdate(){
		/// we keep track of world dimensions
		if(this.props.state.mouseDataHighlightSupported){
			const cu = this.props.state.curves.find(x =>  ['Bars','Plain'].indexOf(x.type) !== -1);
			const { ds } = cu?.type === 'Plain' ? cu.path : ( cu?.marks?.[0]?.mark ?? {} );
			if(ds){
				const world = {
					ymin: ds.y?.c?.min,
					ymax: ds.y?.c?.max,
					xmin: ds.x?.c?.min,
					xmax: ds.x?.c?.max
				};
				/// React ne fait pas de deep compare
				const update = ['ymin','ymax','xmin','xmax'].reduce( (memo,v) => memo || this.state.world?.[v] !== world[v] , false);
				if(update){
					this.setState({world});
				}
			}
		}
	}

	orderAG(){
		const { state,interactive } = this.props;
		const { order } = state;
		const idx = order === 'default' ? i => i : (i,n) => n - 1 - i;
		const curves = order === 'default' ? state.curves : state.curves.concat().reverse();
		return state.axisOnTop === true ? <g>
			{curves.map( (curve, i) => grapher(curve.type,curve, { gIdx: idx(i,curves.length),interactive}))}
			<Axes state={state.axes}/>
		</g> : <g>
			<Axes state={state.axes}/>
			{curves.map( (curve, i) => grapher(curve.type,curve, { gIdx: idx(i,curves.length),interactive}))}
		</g>;
	}

	empty(state){
		return state.empty ? <Waiting x={state.width/2} y={state.height/2}/> : null;
	}

	showMe(){
		const x  = this.props.state.width / 5 || 0;
		const ym = this.props.state.height / 2 - 10 || 10;
		const yg = this.props.state.height / 2 + 10 || 0;
		return <g>
			<rect x={x - 3} y={ym - 10} height={35} width={88} fill='beige' fillOpacity={0.5}/>
			<text textAnchor='start' style={{fill: 'black'}} x={x} y={ym}>{`manager: ${this.props.debug.mgr}`}</text>
			<text textAnchor='start' style={{fill: 'black'}} x={x} y={yg}>{`chart: ${this.props.debug.graph}`}</text>
		</g>;
	}

	render(){
		const { state, interactive, overflow, registerForAutoResize,axisProps } = this.props; 

		const style = overflow ? {overflow: 'visible'} : null;
		const { relative, width, height, curves, legend, autoResize, mouseDataHighlightSupported } = state;
		//label
		let labelsInfo;
		const labelize = axisProps?.ord[0]?.ticks?.major?.labelize;
		// window.axisProps = axisProps;
		if(mouseDataHighlightSupported && curves && legend){
			labelsInfo = curves.filter(c => c.show && ['Bars','Plain'].includes(c.type))
				.map( (c,i) => ({ ...this.state.dataPoints[i], 
						color: c.path.color || c.path.gaugeColor, 
						label: (legend.find(l => l.key === c.key) ?? {}).label
				})
			);
		}
		const viewBox=`0 0 ${width} ${height}`;
		const size = relative ? relative.width || relative.height ? {width: relative.width || relative.height, height: relative.height || relative.width, viewBox} : 
			{width: '100%', height: '100%', viewBox} : 
				{width: width, height: height};
		
		let bounds;
		const parentElement = this.graphRef;
		if(parentElement){
			bounds = parentElement.getBoundingClientRect();
		}

		const outOfGraph = this.state.outOfGraph ?? true;

		const computeTTPlace = () => {
			const left = Math.min(this.state.x + 30,this.state.maxX ?? 0);
			const yBase = this.state.y + (this.state.yOffset ?? 0);
			const top = !this.state.maxX || this.state.x + 30 < this.state.maxX ? yBase : yBase - Math.min(this.state.height/2 + 10,2 * ( this.state.x + 30 - this.state.maxX ));
			return {left, top};
		};

		const rc = <>
		<svg {...size} 
			id={this.props.id}
			data={this.props.mgrId}
			className={`${this.props.className}${state.selected ? ' selected' : ''}`}
			style={style}
			onMouseLeave={() => this.handleMouseOut()}
			onMouseEnter={() => this.handleMouseIn()}
			ref={ref =>{this.graphRef = ref}}>
			{ state.gradient ? <defs>{state.gradient.print( (x,id) => <Gradienter key={`grad.${id}`} state={x}/>)}</defs> : null}
			{ state.cadre.show ? <Cadre state={state.cadre} width={state.width} height={state.height}/> : null }
			{ state.background.show ? <Background className='background' state={state.background}/>  : null }
			{ state.title && state.title.title.length ? <Title className='title' state={state.title} /> : null }
			{ state.axis || state.curves ? this.orderAG() : null}
			{ state.foreground ? <Foreground className='foreground' state={state.foreground} pWidth={state.width} pHeight={state.height}/> : null }
			{ state.mouseDataHighlightSupported ? <line className={outOfGraph ? 'fk-fade-out' : ''} x1={this.state.x} y1={this.state?.world?.ymin ?? 0} x2={this.state.x} y2={this.state?.world?.ymax ?? height} stroke="#cccccc" ></line> : null}
			{
				labelsInfo?.length ?
				<>
					{labelsInfo.map(({cx,cy,color},index) => <g key={color} className={outOfGraph ? 'fk-fade-out' : ''}>
						<circle key={index+color} cx={cx} cy={cy} r={10} fill={color} opacity={0.3}/>
						<circle key={index+1+color} cx={cx} cy={cy} r={3} fill={color}/>
					</g>)}
				</> : null
			}
			{ this.props.debug ? this.showMe() : null}
			{ this.empty(state) }
			<Measurer id={this.props.id}/>
		</svg>
		{labelsInfo?.length && this.state.x && this.state.y ? 
			<div className={`fk-tooltip-div fk-tooltip-${outOfGraph ? 'out' : 'in'}`} style={computeTTPlace()} ref={tt => this.measureTt(tt)}>
				<span className='fk-tooltip-title'>
					{labelsInfo[0].x instanceof Date ? capitalizeFirstLetter(labelsInfo[0].x.toLocaleDateString(undefined,{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })):labelsInfo[0].x}
				</span>
				{labelsInfo.map( (x,i) => <div key={`tt.${i}`} className='fk-tooltip-text'>
					<span className='fk-tooltip-label' style={{color: x.color}}>{x.label.toUpperCase()}</span>
					<span className='fk-tooltip-value'>
						{labelize && labelize(x.y) ? labelize(x.y) : x.y?.toLocaleString('fr-FR')}</span>
				</div>)}
			</div> : null }
		</>;

		if (autoResize) {
			return <div ref={registerForAutoResize} className='fk-chart-svg-div'>{rc}</div>
		}
		return rc;
	}
}
