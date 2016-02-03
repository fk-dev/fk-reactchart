var React = require('react');
var dataScale = require('../core/space-transf.cs.js');
var imUtils = require('../core/im-utils.cs.js');

/*
	{
		draw: false,
		ds: {
			x: {},
			y: {}
		},
		position:{
			x: 0,
			y: 0
		},
		color: 'black',
		width: 0,
		fill: undefined,
		size: 0,
		shade: 1
	}
*/

var SquareMark = React.createClass({

	shouldComponentUpdate: function(props){
		return !imUtils.isEqual(props.state,this.props.state);
	},

	render: function(){
		var state = this.props.state;

		var x = dataScale.toC(state.ds.x,state.position.x) - state.size / 2;
		var y = dataScale.toC(state.ds.y,state.position.y) + state.size / 2;
		var f = state.fill || state.color;

		return <rect x={x} y={y} width={state.size} height={state.size} fill={f} opacity={state.shade} stroke={state.color} strokeWidth={state.width}/>;
	}
});

module.exports = SquareMark;
