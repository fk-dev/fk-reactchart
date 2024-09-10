let _register = [];

export function addReg(id){
	if(_register.indexOf(id) === -1){
		_register.push(id);
	}
}

export function delReg(id){
	const idx = _register.indexOf(id);
	if(idx !== -1){
		_register.splice(idx,1);
	}
}

export function getReg(id){
	return _register.indexOf(id) + 1;
}