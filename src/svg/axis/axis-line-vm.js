import { vm as cartVM } from './axis-cart-line-vm.js';
import { vm as polarVM } from './axis-polar-line-vm.js';

/*
	{
		show: true || false,
	///// line part
		line: {
			CS: ''
			start: {x,y},
			end: {x, y},
			origin: {x,y},
			radius: {x, y},
			color: '',
			width:,
		},

	/// label part
		label: Label = {
			label: '',
			FSize: ,
			offset: {x, y},
			anchor: ''
			color: '',
			dir: {x, y}
		},

 /// common factor part
		comFac: {
			factor: ,
			offset: {x, y},
			FSize: ,
			anchor
		}
	}
*/

export function vm(ds,cs, props,partnerDs,dir, motherCss, measurer){
	return cs === 'cart' ? cartVM(ds,cs, props,partnerDs,dir, motherCss, measurer) : polarVM(ds,cs, props,partnerDs,dir, motherCss, measurer);
}
