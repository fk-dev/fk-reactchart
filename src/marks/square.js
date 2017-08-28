export let vm = {
	create: (get, { position, props, ds, key, open }) => {

		let draw  = props.markProps.draw || position.draw         || false;
		let color = position.color       || props.markProps.color || props.markColor || props.color || 'black';
		let width = position.width       || props.markProps.width || draw ? 1 : 0;
		let size  = position.size        || props.markProps.size  || props.markSize || 3;
		let shade = position.shade       || props.markProps.shade || 1;

		let fill  = open ? 'none' : position.fill || props.markProps.fill || color;
	
		return {
			key,
			draw,
			ds,
			position:{
				x: position.x,
				y: position.y
			},
			color,
			width,
			fill,
			size,
			shade
		};
	}
};


export let ovm = {
	create: (get, { position, props, ds, key } ) => {
		props.markProps.draw = true;
		return vm.create(get, { position, props, ds, key, open: true });
	}
};
