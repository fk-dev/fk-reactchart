import React, { useState, useMemo } from 'react';
import { utc } from 'moment';
import { makeInterval, isValid } from './legend-utils.js';
export default function Filter({mgr,filter}){

	const getBoundaries = (mgr,filter) => {
		const data = (mgr.unprocessedProps().data ?? [])
			.filter(x => x.abs?.type === 'date')
			.map(x => ({series: (x.originalSeries || x.series).map(x => x.x)}))
			.reduce( (memo,value) => memo.concat(value.series), []); // get all dates in abs of graph
		const absoluteFrom = data.reduce( (prev,cur) => prev.getTime() < cur.getTime() ? prev : cur);
		const absoluteTo   = data.reduce( (prev,cur) => prev.getTime() > cur.getTime() ? prev : cur);

		let activeFilters = [];
		const hasFrom = filter.find(x => x.interval === 'from');
		const hasTo   = filter.find(x => x.interval === 'to');
		filter.forEach( f => {
			const { label, interval } = f;
			const { from, to, isActive } = makeInterval(interval,{absoluteFrom, absoluteTo});
			if(isActive){
				activeFilters.push({key: interval, label, from, to});
			}
		});

		return {absoluteFrom, absoluteTo, activeFilters, hasFrom, hasTo};
	};

	const { absoluteFrom, absoluteTo, activeFilters, hasFrom, hasTo } = useMemo(() => getBoundaries(mgr,filter),[mgr,filter]);
	const [who, setWho] = useState('ALL');
	const [from, setFrom] = useState(absoluteFrom);
	const [to, setTo] = useState(absoluteTo);
	
	const fromValue = (who,value) => {
		const _from = who === 'from' ? value : from;
		const _to   = who === 'to'   ? value : to;
		return { from: _from, to: _to };
	};

	const zoom = (me, {from, to}) => {
		mgr.dynamic.filter.curve({from,to });
		setFrom(from);
		setTo(to);
		setWho(['from', 'to'].includes(me) && !from && !to ? 'ALL' : me);
	}

	const clickMe = (me) => {
		const { from, to } = activeFilters.find(x => x.key === me);
		zoom(me, {from, to});
	};

	const filterFromTo = (val,type) => {
		if (!val) {
			const { from, to } = fromValue(type,null);
			return zoom(type, {from, to});
		} else {
			let value = utc(val);
			if(!value.isValid()){ return; }
			value = value.toDate();
			if(isValid({value, absoluteFrom, absoluteTo})){
				const { from, to } = fromValue(type,value);
				return zoom(type, {from, to});
			}
		}
	}

	const filterFrom = from => {
		filterFromTo(from,'from');
	};

	const filterTo = to => {
		filterFromTo(to,'to');
	};

	const showFromTo = ['from', 'to'].includes(who);

	return absoluteFrom && absoluteTo ? <div className='reactchart-filter'>
		{activeFilters.map(f => <button key={f.key} disabled={who === f.key} className={`reactchart-btn${who === f.key ? ' reactchart-btn-active' : ''}`} onClick={() => clickMe(f.key)}>{f.label}</button>)}
		{hasFrom ? <input type="text" placeholder={hasFrom.label} className='reactchart-from'
			onFocus={(e) => e.target.type = "date"} onBlur={(e) => e.target.type = "text"} value={showFromTo  && from ? utc(from).format('YYYY-MM-DD') : ''} onChange={(e) => filterFrom(e.target.value)}/> : null}
		{hasTo   ? <input type="text" placeholder={hasTo.label} className='reactchart-to'
			onFocus={(e) => e.target.type = "date"} onBlur={(e) => e.target.type = "text"} value={showFromTo && to ? utc(to).format('YYYY-MM-DD') : ''} onChange={(e) => filterTo(e.target.value)}/> : null}
	</div> : null;
}
