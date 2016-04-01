var React = require('react');
var Tick = require('./Tick.cs.jsx');
var AxisLine = require('./AxisLine.cs.jsx');
var _ = require('underscore');
var imUtils = require('../core/im-utils.cs.js');

/*
	{
		axisLine: AxisLine,
		ticks: [Tick]
	}
*/

var Axe = React.createClass({
	shouldComponentUpdate: function(props){
		return !imUtils.isEqual(props.state,this.props.state);
	},

	render: function(){

		return <g>
			{_.map(this.props.state.ticks, (tick) => {
				return <Tick key={tick.key} state={tick}/>;
			})}
			<AxisLine state={this.props.state.axisLine}/>
		</g>;
}
});

module.exports = Axe;