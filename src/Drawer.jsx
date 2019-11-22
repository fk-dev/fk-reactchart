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

export default class Drawer extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	orderAG(){
		const { state, selectable } = this.props;
		const { order } = state;
		const idx = order === 'default' ? i => i : (i,n) => n - 1 - i;
		const curves = order === 'default' ? state.curves : state.curves.concat().reverse();
		return state.axisOnTop === true ? <g>
			{curves.map( (curve, i) => grapher(curve.type,curve, { gIdx: idx(i,curves.length), selectable }))}
			<Axes state={state.axes}/>
		</g> : <g>
			<Axes state={state.axes}/>
			{curves.map( (curve, i) => grapher(curve.type,curve, { gIdx: idx(i,curves.length), selectable }))}
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

		const { state } = this.props; 
		const style = this.props.overflow ? {overflow: 'visible'} : null;
		const { relative, width, height } = state;

		const viewBox=`0 0 ${width} ${height}`;
		const size = relative ? relative.width || relative.height ? {width: relative.width || relative.height, height: relative.height || relative.width, viewBox} : 
			{width: '100%', height: '100%', viewBox} : 
				{width: width, height: height};

		const svg = () => <svg {...size} id={this.props.id}  data={this.props.mgrId} className={this.props.className} style={style}>
			{ state.gradient ? <defs>{state.gradient.print( (x,id) => <Gradienter key={`grad.${id}`} state={x}/>)}</defs> : null}
			{ state.cadre.show ? <Cadre state={state.cadre} width={state.width} height={state.height}/> : null }
			{ state.background.show ? <Background state={state.background}/>  : null }
			{ state.title && state.title.title.length ? <Title state={state.title} /> : null }
			{ state.axis || state.curves ? this.orderAG() : null}
			{ state.foreground ? <Foreground state={state.foreground} pWidth={state.width} pHeight={state.height}/> : null }
			{ this.props.debug ? this.showMe() : null}
			{ this.empty(state) }
			<Measurer id={this.props.id}/>
		</svg>;

		return state.selected ? <div className='selected'>{svg()}</div> : svg();
	}
}
