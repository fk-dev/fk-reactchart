import React, { forwardRef } from 'react';
import { init }   from './helpers.js';
import { Drawer, utils } from './svg';
//import Drawer from './svg/Drawer.jsx';
//import { rndKey, emptyState } from './svg/core/utils.js';
import { GraphSettings, ToggleMenu } from './interactive';

const { rndKey, emptyState } = utils;

export default class Graph extends React.Component {

	constructor(props){
		super(props);
		this.myId = rndKey();
		this.myKey = props.graphId || props.chartId || rndKey();
		if(props.onGenerateKey){
			props.onGenerateKey(this.myKey);
		}
		this.type = 'graph';
		this.state = { settings: false, showMenu: false };
		this.init();
	}

	init(){
		const pr = this.props;
		if(pr.__preprocessed){ // done outside graph
			this.sh = pr;
			// only the key, can't forceUpdate before didMount
			this.sh.addKey(this.myKey);
			if(this.props.namespace){
				this.sh.setNamespace(this.props.namespace,this.myKey);
			}
			if(this.props.debug && !this.sh.hasDebug()){
				this.sh.setDebug(this.props.debug, this.myKey);
			}
		}else{ // to be done here
			if(pr.onGenerateKey){
				pr.onGenerateKey(this.myKey);
			}
			this.sh = init(pr,this.type,{ key: this.myKey, namespace: this.props.namespace}, this.props.debug);
		}
	}

	// we can call forceUpdate now
	componentDidMount(){
		if(!this.sh){
			throw new Error('A Chart object is initialized without a manager!');
		}

		this.sh.addKey(this.myKey,this,this.myId);
	}

	shouldComponentUpdate(pr){
		const prInteractive  = pr.rawProps          ? pr.rawProps()?.interactive         : false;
		const thisInteractive = this.props.rawProps ? this.props.rawProps()?.interactive : false;
		this.changeOfMgrByRawProps(pr); // update in manager
		return prInteractive || thisInteractive || pr.namespace !== this.props.namespace;
	}

	changeOfMgrByRawProps(pr){
		// we changed the props
			// 1 - human friendly
		if(!pr.__preprocessed){ // not sh, we update if not both empty (might be an empty graph rerendering)

			if(!this.sh || !this.sh.isEmpty(pr) || !this.sh.isEmpty()){
				this.sh.kill(this.myKey); // no more in previous helper
				this.sh = init(pr,this.type,{ key: this.myKey, obj: this, namespace: this.props.namespace}, this.props.debug);
			}

			// 2 - helpers
		}else if(pr.__mgrId !== this.sh.__mgrId){
			this.sh.kill(this.myKey); // no more in previous helper
			this.sh = pr;
			this.sh.addKey(this.myKey, this);
			if(this.props.debug && !this.sh.hasDebug()){
				this.sh.setDebug(this.props.debug, this.myKey);
			}
		}
	}

	// case when updating props without going to shouldComponentUpdate
	componentDidUpdate(){
		if(this.props.__preprocessed){
			this.changeOfMgrByRawProps(this.props);
		}
	}

		// obj will go away
	componentWillUnmount(){
		if(this.sh && this.sh.__preprocessed){
			this.sh.kill(this.myKey);
		}
	}

	showIds(){
		if(this.props.whoAmI){
			return {
				mgr: this.sh.__mgrId,
				graph: this.myKey
			};
		}
	}

	render(){
		const state = this.sh && this.sh.ready() ? this.sh.get(this.myKey) : emptyState;

		const cn    = this.props.namespace || ( this.sh ? this.sh.getNamespace() : 'reactchart' );
		const mgrId = this.sh?.__mgrId ?? 'noMgr';

		const rawProps       = this.props.rawProps ? this.props.rawProps() : null;
		const showLegend     = rawProps?.legend?.showLegend;
		const legendPosition = rawProps?.legend?.position;
		const isFilterOn     = rawProps?.dateFilters?.length ?? false;
		const interactive    = rawProps?.interactive ?? false;

		const LegendGraph = () => showLegend ? <Legend {...this.props	} onlyLegend={true}/> : null;

		const { hideMenu } = this.props;

		const { settings, showMenu } = this.state;

		return interactive ? <div width="100%" height="100%">{/*interactive means we are NOT in an encapsulating SVG*/}
			{ !hideMenu ? <ToggleMenu toggleSettings={() => this.setState({settings : !this.state.settings})} 
				toggleMenu={() => this.setState({showMenu: !this.state.showMenu})} settings={settings} showMenu={showMenu} 
				getData={() => this.props.rawProps()?.data ?? []}/> : null }
		{
			settings ? <GraphSettings props={this.props} toggleSettings={() => this.setState({settings: !this.state.settings})}/> : 
			<>
				{
					isFilterOn ? <div className='row'>
						<Legend {...this.props	} onlyFilter={true}/>
					</div> : null
				}
				<div className='row'>
				{
					legendPosition === 'right' ? <>{/* legend right*/}
						<div className='col-sm-10' >
							<Drawer id={this.myKey} mgrId={mgrId} state={state} className={cn} overflow={this.props.overflow} debug={this.showIds()} interactive/>
						</div>
						<div className='col-sm-2'>
							<LegendGraph/>
						</div>
					</> :
					legendPosition === 'left' ? <>{/* legend left*/}
						<div className='col-sm-2'>
							<LegendGraph/>
						</div>
						<div className='col-sm-10' >
							<Drawer id={this.myKey} mgrId={mgrId} state={state} className={cn} overflow={this.props.overflow} debug={this.showIds()} interactive/>
						</div>
					</> : <>
						<div className='col-sm-12' >{/* legend below*/}
							<Drawer id={this.myKey} mgrId={mgrId} state={state} className={cn} overflow={this.props.overflow} debug={this.showIds()} interactive/>
						</div>
						<div className='col-sm-2'>
							<LegendGraph/>
						</div>
					</>
				}
				</div>
			</>
		}
		</div> :
		<Drawer id={this.myKey} mgrId={mgrId} state={state} className={cn} overflow={this.props.overflow} debug={this.showIds()}/>
		;
	}
}

class Legend extends React.Component {

	constructor(props){
		super(props);
		this.myKey = `l.${props.legendId || rndKey()}`;
		this.type = 'legend';
		this.init();
	}

	// we can call forceUpdate now
	componentDidMount(){
		if(!this.sh){
			throw new Error('A Legend object is initialized without a manager!');
		}

		this.sh.addKey(this.myKey,this);
	}

	shouldComponentUpdate(pr){

		if(!pr.__preprocessed){ // not sh, we update anyway
			this.sh = init(pr,this.type,{ key: this.myKey, obj: this});
			return true;
		}
		return false;
	}

	// obj will go away
	componentWillUnmount(){
		if(this.sh && this.sh.__preprocessed){
			this.sh.kill(this.myKey);
		}
	}

	init(){
		const pr = this.props;
		if(pr.__preprocessed){ // done outside graph
			this.sh = pr;
			this.sh.addKey(this.myKey);
		}else{ // to be done here
			this.sh = init(pr,this.type,{ key: this.myKey}, this.props.debug);
		}
	}

	iconStyle(props,type){

		const o = props.faded ? 0.2 : 1;
		const c = props.clickable ? "pointer" : null;

		let sty = {
			opacity: o,
			cursor: c
		};

		if(type === 'icon'){
			sty.width = props.width;
		}

		return sty;
	}

	table(){
		let nCol = this.props.col || 1;

		const tabline = (cells,idx) => {
			const cs = (cell) => cell.icon.props.faded ? 'fade-chart' : '';
      const clicker = (cell) => this.props.noMarkClick ? null : () => cell.click(this.sh, this.myKey);
			const changer = (cell) => !cell.change ? e => e : (e) => cell?.change(this.sh, this.myKey,e);
			const icon  = (cell) => <td key={`i.${cell.label||cell.icon?.props?.clickable}`} className={cs(cell)} style={this.iconStyle(cell.icon.props,'icon')} onClick={clicker(cell)}>{cell.icon.icon({...cell.icon.props,change:changer(cell)})}</td>;
			const label = (cell) => <td key={`l.${cell.label||cell.icon?.props?.clickable}`} className={cs(cell)} style={this.iconStyle(cell.icon.props)} onClick={clicker(cell)}>{cell.label}</td>;

			const fill = () => {
				const out = [];
				for(let i = 0; i < cells.length; i++){
					out.push(icon(cells[i]));
					out.push(label(cells[i]));
				}
				return out;
			};

			return <tr key={idx}>{fill()}</tr>;
		};

		const gmap = (tab, oneLine) => {
			tab = tab || [];
			if(this.props.onlyLegend || !this.props.onlyFilter){
				tab = tab.filter(t=>t.icon.props.clickable === 'fade');
			}else if(this.props.onlyFilter){
				nCol = Infinity;
				tab = tab.filter(t=>t.icon.props.clickable !== 'fade');
			}
			let out = [];
			let line = [];
			let j = 0;
			for(let i = 0; i < tab.length; i++){
				if(j !== nCol){
					j++;
					line.push(tab[i]);
				}else{
					out.push(oneLine(line,i - 1));
					j = 1;
					line = [tab[i]];
				}
			}
			if(line.length !== 0){
				out.push(oneLine(line, tab.length));
			}
			return out;
		};

		return <table>
			<tbody>{gmap(this.sh.legend(this.myKey), (line,idx) => tabline(line,idx))}</tbody>
		</table>;
	}

	line(){
		const print = (l,idx) => {
			// a little depth to the icon
			// a little space to breathe
			// here to avoid use of CSS, easyness of use
			// for a third party
			const margin = {
				style: {
					marginRight: '10pt'
				}
			};
			const { icon, click, label } = l;
			const iconStyle = { ...this.iconStyle(icon.props,'icon'), verticalAlign: 'sub'};
			return <span key={idx} {...margin} onClick={() => click(this.sh, this.myKey)}>
				<span style={iconStyle}>{icon.icon(icon.props)}</span>
				<span style={this.iconStyle(icon.props)}>{label}</span>
			</span>;
		};

		return <div>{(this.sh.legend(this.myKey) || []).filter(l=>{
			if(this.props.onlyLegend || !this.props.onlyFilter){
				return l.icon.props.clickable === 'fade';
			}else if(this.props.onlyFilter){
				return l.icon.props.clickable !== 'fade';
			}
		}).map( (l, idx) => print(l,idx) )}</div>;
	}

	render(){
		return <>
		{this.sh ? this.props.line ? this.line() : this.table() : null}
		{/* add date filter input from, to */}
	
		</>;
	}
}

Graph.Legend = Legend;
