import React from 'react';
import Axes from './Axes.jsx';
import { grapher } from './graphs/grapher.jsx';
import Cadre from './Cadre.jsx';
import Background from './Background.jsx';
import Foreground from './Foreground.jsx';
import Title from './Title.jsx';

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
		const { state } = this.props;
		const { css } = state;
		return state.axisOnTop === true ? <g>
			{state.curves.map( (curve, gIdx) => grapher(curve.type,curve, {css, gIdx}))}
			<Axes state={state.axes}/>
		</g> : <g>
			<Axes state={state.axes}/>
			{state.curves.map( (curve, gIdx) => grapher(curve.type,curve, {css, gIdx}))}
		</g>;
	}

	empty(){
		const { state } = this.props;
		const emp = !state.cadre && !state.background  && !(state.title && state.title.title.length) && !state.axis && !(state.curves && state.curves.length) && !state.foreground;
		return emp ? <Cadre width={state.width} height={state.height}/> : null;
	}

	render(){

		const state = this.props.state || {width: 200, height: 200};
		const { css } = state;

		return <svg width={state.width} height={state.height} id={this.props.id}>
			{ state.cadre ?      <Cadre width={state.width} height={state.height}/> : null }
			{ state.background ? <Background state={state.background}/>  : null }
			{ state.title && state.title.title.length ? <Title css={css} state={state.title} /> : null }
			{ state.axis || state.curves ? this.orderAG() : null}
			{ state.foreground ? <Foreground state={state.foreground} pWidth={state.width} pHeight={state.height}/> : null }
			{ this.empty() }
			<text x={-10} y={-10} anchor='middle' style={{visibility: 'hidden'}} id={`fkchartmeasurer-${this.props.id}`}/>
		</svg>;
	}
}
