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

	render(){
		const state = this.props.state || {width: 200, height: 200};
		return <svg width={state.width} height={state.height} id={this.props.id}>
			{ state.cadre ? <Cadre width={state.width} height={state.height}/> : null }
			{ state.background ? <Background state={state.background}/> : null }
			{ state.title ? <Title state={state.title} /> : null }
			{ state.axis || state.curves ? this.orderAG() : null}
			{ state.foreground ? <Foreground state={state.foreground} pWidth={state.width} pHeight={state.height}/> : null }
		</svg>;
	}
}
