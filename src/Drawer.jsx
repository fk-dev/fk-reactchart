import React from 'react';
import Axes from './Axes.jsx';
import { grapher } from './graphs/grapher.jsx';
import Cadre from './Cadre.jsx';
import Background from './Background.jsx';
import Foreground from './Foreground.jsx';
import Title from './Title.jsx';

import { isEqual } from './core/im-utils.js';
import { map } from 'underscore';

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
		let { state } = this.props;
		let { css } = state;
		return state.axisOnTop === true ? <g>
			{map(state.curves, (curve, gIdx) => grapher(curve.type,curve, {css, gIdx}))}
			<Axes state={state.axes}/>
		</g> : <g>
			<Axes state={state.axes}/>
			{map(state.curves, (curve, gIdx) => grapher(curve.type,curve, {css, gIdx}))}
		</g>;
					
	}

	render(){
		let state = this.props.state;
		return <svg width={state.width} height={state.height}>
			{ state.cadre ? <Cadre width={state.width} height={state.height}/> : null }
			{ state.background ? <Background state={state.background}/> : null }
			<Title state={state.title} />
			{this.orderAG()}
			{ state.foreground ? <Foreground state={state.foreground} pWidth={state.width} pHeight={state.height}/> : null }
		</svg>;
	}
}
