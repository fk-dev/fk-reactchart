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
		let curveParams = curve.type === 'Plain' ? curve.path : curve.type === 'Bars' ? curve.marks[0]?.mark:null;
		if(!curveParams){
			return null;
		}
		const dsx = curveParams.ds.x;
		const dsy = curveParams.ds?.y;
		// console.log("dsx:,x"+JSON.stringify({dsx,mouseX}));
		const dataX =  toD(dsx,mouseX);
		// console.log("got datax:",dataX);
		const positions = curve.type === 'Plain' ? curve.path.positions: curve.type === 'Bars' ? curve.marks.map(m=>m.mark.position):curve.type === 'Pie' ?  curve.path.positions.map(p=>({x:p.color,y:p.value})):[];
		// console.log("positions:",positions);
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
// see https://stackoverflow.com/questions/55334402/how-to-have-a-drop-shadow-on-a-transparent-rect-svg
const Tooltip = ({labelX,labelY,data,dataX,bounds,originalX,outOfGraph})=>{

	const boundLeft = bounds?.x;
	const boundRight = bounds?.right;
	//adjust labelX
	if(originalX-100 <= boundLeft){
		labelX += 100;
	}
	if(originalX+100 >= boundRight){
		labelX -= 100;
	}
	let display = outOfGraph;
	labelX = isNaN(labelX) ? 0 : labelX; 
	const tooltipStyle = {
			fill:"white" ,
			fillOpacity: '70%',
      stroke: "#cccccc",
      strokeWidth: 1,
      PointerEvent: "none"
  };
	const tooltipTextStyle = {
		fill:"#333333",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px"
	};
	data = data?.filter(d=>d.x);
	if(!data.length){
		return null;
	}
	const height = 20 + 40*data.length;
	const width = 300;
	const dl = 3;
	const xx = labelX - 150;
	return <g style={{opacity:display? 0:1,transition: "opacity 0.3s ease"}}>
		<defs>
			<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    		<feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
 			</filter>
  		<filter id="trans-shadow">
  			<feColorMatrix type="matrix" values="1 0 0 0 0 
        			                               0 1 0 0 0 
              			                         0 0 1 0 0 
                    			                   0 0 0 100 0"
                          			             result="boostedInput"/>
                                       
    		<feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
				<feComposite operator="out" in2="boostedInput"/>
			</filter>
		</defs>
		<rect x={labelX} y={labelY} width="300" height={20+40*data.length} fillOpacity="0.01" filter="url(#trans-shadow)"/>
		<rect x={labelX} y={labelY} width={width} height={height} style={tooltipStyle}/>
		<text x={labelX+100} y={labelY+5} dy="1em" textAnchor="middle" style={tooltipTextStyle} >
			<tspan fontFamily='Palatino' dy="1.2em" x={labelX+150}>
				{dataX instanceof Date ? capitalizeFirstLetter(dataX.toLocaleDateString(undefined,{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })):dataX}
			</tspan>
			<tspan dy="1.5em"> </tspan>
			{
				data.map((d,i)=>
				<ToolTipContent key={i} {...{xData:d.x,yData:d.y,xPos:labelX+150,color:d.color,label:d.label}}/>)
			}
		</text>
	</g>;
};
const ToolTipContent = ({label,yData,xPos,color})=>{
	if(!yData){
		return null;
	}
	return(
		<>
			<tspan fill={color} x={xPos} dy="1em" fontFamily='Gill Sans'>
			{label.toUpperCase()+ ' : '}
			</tspan>
			<tspan fill="black" strokeWidth="3" fontWeight={600}>
			{yData?.toLocaleString('fr-FR')}
			</tspan>
			<tspan dy="1em"> </tspan>
			</>
	);
};
export default class Drawer extends React.Component {

	constructor(props) {
    super(props);
    this.state = {
			outOfGraph: true,
			dataPoints: []
		};
  }

	shouldComponentUpdate(props){
		return props.interactive || !isEqual(props.state,this.props.state) || props.className !== this.props.className;
	}

	handleMouseMove = (event) => {

		if(!this.props.interactive || this.state.outOfGraph){
			return;
		}
	
		const parentElement = this.graphRef;
		let pt = parentElement.createSVGPoint();
		pt.x = event.clientX; pt.y = event.clientY;
		const res = pt.matrixTransform(parentElement.getScreenCTM().inverse());
    // const rect = parentElement.getBoundingClientRect();
		const x = res.x;
    const y = res.y;
		// console.log("x,y mouse:"+JSON.stringify({x,y}));
		// const firstC = this.props.state.curves[0];
		// const {labelX,labelY,data} = hoverLabelData(firstC,x);
		// console.log("label data:"+JSON.stringify({labelX,labelY,data}));
		const dataPoints = this.props.state.curves.map(c => hoverLabelData(c,x));
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
		// console.log("will add mousemove listener");
		window.document.addEventListener('mousemove',this.handleMouseMove);
		if(this.graphRef){
			this.graphRef.addEventListener('mouseout', this.handleMouseOut);
			this.graphRef.addEventListener('mouseover',this.handleMouseIn);
		}

	}
	componentWillUnmount(){
		// console.log("will remove mousemove listener");
		window.document.removeEventListener('mousemove',this.handleMouseMove);
	}
	orderAG(){
		const { state,interactive } = this.props;
		const { order } = state;
		const idx = order === 'default' ? i => i : (i,n) => n - 1 - i;
		const curves = order === 'default' ? state.curves : state.curves.concat().reverse();
		// console.log("got abs axe:"+JSON.stringify(state.axes.abs));
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
		const { state,interactive } = this.props; 

		const style = this.props.overflow ? {overflow: 'visible'} : null;
		const { relative, width, height,curves,legend } = state;
		//label
		let labelsInfo;
		if(interactive && curves && legend){
			// console.log("legend:"+JSON.stringify(legend));
			// console.log("curves:"+JSON.stringify(curves));
			labelsInfo = curves.filter(c=> c.show && ['Bars','Plain'].includes(c.type)).map((c,i) => ({ ...this.state.dataPoints[i], color:c.path.color || c.path.gaugeColor, label: legend.filter(l => !l.icon.props.faded)[i].label}) );
			// console.log("check labelsInfo:"+JSON.stringify(labelsInfo));
		}
		// console.log("check labelsInfo:"+JSON.stringify(labelsInfo));
		const viewBox=`0 0 ${width} ${height}`;
		const size = relative ? relative.width || relative.height ? {width: relative.width || relative.height, height: relative.height || relative.width, viewBox} : 
			{width: '100%', height: '100%', viewBox} : 
				{width: width, height: height};
		
		let bounds;
		const parentElement = this.graphRef;
		if(parentElement){
			bounds = parentElement.getBoundingClientRect();
		}
		return(
		<svg {...size} id={this.props.id}  data={this.props.mgrId} className={`${this.props.className}${state.selected ? ' selected' : ''}`} style={style} ref={ref =>{this.graphRef = ref}}>
			{ state.gradient ? <defs>{state.gradient.print( (x,id) => <Gradienter key={`grad.${id}`} state={x}/>)}</defs> : null}
			{ state.cadre.show ? <Cadre state={state.cadre} width={state.width} height={state.height}/> : null }
			{ state.background.show ? <Background className='background' state={state.background}/>  : null }
			{ state.title && state.title.title.length ? <Title className='title' state={state.title} /> : null }
			{ state.axis || state.curves ? this.orderAG() : null}
			{ state.foreground ? <Foreground className='foreground' state={state.foreground} pWidth={state.width} pHeight={state.height}/> : null }
			{!interactive ? null:<line x1={this.state.x} y1='0' x2={this.state.x} y2={height} stroke="#cccccc" ></line>}
			{
				labelsInfo?.length ?
				<>
					{labelsInfo.map(({cx,cy,color},index) => <g key={color}>
						<circle key={index+color} cx={cx} cy={cy} r={10} fill={color} opacity={0.3}/>
						<circle key={index+1+color} cx={cx} cy={cy} r={3} fill={color}/>
					</g>)}
					<Tooltip {...{labelX: this.state.x - 150, labelY:height/3 - 50, data: labelsInfo, dataX: labelsInfo[0].x, bounds, originalX: this.state.originalX, outOfGraph: this.state.outOfGraph}}/>
				</> : null
			}
			{ this.props.debug ? this.showMe() : null}
			{ this.empty(state) }
			<Measurer id={this.props.id}/>
		</svg>)
		;
	}
}

//add intervals 1y|6M|3M
//on click 3M-> positions filter -> reinit (old positions lost)
// on click 1Y -> filter positions 
