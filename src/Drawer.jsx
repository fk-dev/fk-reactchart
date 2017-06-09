let React = require('react');
let Axes = require('./Axes.jsx');
let grapher = require('./graphs/grapher.jsx');
let Cadre = require('./Cadre.jsx');
let Background = require('./Background.jsx');
let Foreground = require('./Foreground.jsx');
let Title = require('./Title.jsx');

let imUtils = require('./core/im-utils.js');
let _ = require('underscore');

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

class Drawer extends React.Component {

	shouldComponentUpdate(props){
		return !imUtils.isEqual(props.state,this.props.state);
	}

	orderAG(){
		let { state } = this.props;
		let { css } = state;
		return state.axisOnTop === true ? <g>
			{_.map(state.curves, (curve, gIdx) => grapher(curve.type,curve, {css, gIdx}))}
			<Axes state={state.axes}/>
		</g> : <g>
			<Axes state={state.axes}/>
			{_.map(state.curves, (curve, gIdx) => grapher(curve.type,curve, {css, gIdx}))}
		</g>;
					
	}

	render(){
		let state = this.props.state;
		return <svg width={state.width} height={state.height}>
			{state.cadre ? <Cadre width={state.width} height={state.height}/> : null }
			<Background state={state.background}/>
			<Title state={state.title} />
					{this.orderAG()}
			<Foreground state={state.foreground} pWidth={state.width} pHeight={state.height}/>
			</svg>;

	}
}

module.exports = Drawer;
