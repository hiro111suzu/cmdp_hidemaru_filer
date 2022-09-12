//. config / global var
try {
	eval( loadTextFile( ScriptFullName.replace( /\\[^\\]+\.js$/, '\\common.js' ) ) );
} catch( err ) {
	var msg = [ 'common.js���ŃG���[����' ];
	for ( var key in err )
		msg.push( key + ': ' + err[key] )
	message( msg.join('\n') );
}

var ext_focused = focused
	? ( focused.is_folder()
		? 'folder'
		: ( focused.ext().toLowerCase() || '?' )
	)
	: null
;

var separator = {
	arg: ';' ,
	capt1: '  (' ,
	capt2: ')'
}

var title_script = '�G�ۃt�@�C���[ �R�}���h�p���b�g';

//. main
//.. user �ݒ�ǂݍ���
var fn_tsv = ScriptFullName.replace( '.js', '.tsv' );
if ( ! fn_tsv.is_file() ) {
	_error([ '�R�}���h�f�[�^�t�@�C����������܂���', fn_tsv ]);
}

//... cmd_obj �׍H
var cmd_obj = _load_tsv( fn_tsv );
if ( cmd_obj._short_cmd ) for ( var key in cmd_obj._short_cmd ) {
	cmd_obj[ key ] = {
		cmd: cmd_obj._short_cmd[ key ]
	};
}
if ( cmd_obj._short_open ) for ( var key in cmd_obj._short_open ) {
	cmd_obj[ key ] = {
		open: cmd_obj._short_open[ key ].split_l(',').trim(),
		capt: cmd_obj._short_open[ key ].split_r(',').trim(),
	};
}
if ( cmd_obj._short_tool ) for ( var key in cmd_obj._short_tool ) {
	cmd_obj[ key ] = {
		tool: key ,
		capt: cmd_obj._short_tool[ key ] || 'tool��' + key + '�����s'
	};
}

//- �O���[�v�R�}���h�����j���[�ɓ����
for ( var name in cmd_obj ) {
	if ( name.slice( -1 ) != '/' || name.slice( 0, 4 ) == 'menu' ) continue;
	var name_rep = 'menu/' + name.replace( /\/$/, '' );
	if ( cmd_obj[ name_rep ] ) continue;
	cmd_obj[ name_rep ] = {
		capt: cmd_obj[ name ].capt + ' ���j���[' ,
		menu: name
	}
}

//... user_conf
var user_conf = _merge_obj(
	cmd_obj._config || {},
	{
		ext_type: cmd_obj._ext_type || {},
		exe_path: cmd_obj._exe_path || {},
		alias	: cmd_obj._alias || {}
	}
);
var path = _merge_obj(
	cmd_obj._path || {},
	{
		cmdp_dir	: ScriptFullName.parent() ,
		script_dir	: ScriptFullName.parent().parent() ,
		current_dir	: GetDirectory() ,
		focused		: focused
	}
);

//... macrodll�t�@�C����
user_conf.path_macrodll = user_conf.path_macrodll
	? user_conf.path_macrodll.env_expand()
	: ScriptFullName.parent() + '\\macrodll-'
		+ ( platform & 0x00080000 ? '64' : '32' ) + '.dll'
;
if ( ! user_conf.path_macrodll.is_file )
	_error( 'macrodll.dll �t�@�C��������܂���B\n' + path_macrodll );

//... tool.js�t�@�C����
user_conf.path_tooljs = user_conf.path_tooljs
	? user_conf.path_tooljs.env_expand()
	: ScriptFullName.parent() + '\\tool.js'
;

//... debuglog
if ( user_conf.debug_soft )
	user_conf.debug_soft = user_conf.debug_soft.env_expand();
_debug_log();

//.. ���s
if ( getArg( 0 ) ) {
	var a1 = getArg(0);
	var a2 = getArg(1);
	_debug_log( { '����1': a1, '����2': a2 }, '�X�N���v�g�����󂯎��' );
	if ( ! _job( a1, a2 ) )
		_error([ '�R�}���h���s���s', '�X�N���v�g����', getArg(0) ]);
} else {
	if ( ! _cmd_input() )
		_error([ '�R�}���h���s���s', '�s���Ȗ��' ]);		
}
endMacro();

//- main �����܂�

//. function
//.. _cmd_input
function _cmd_input( group ) {
	//... �R�}���h��⃊�X�g�쐬
	var item_set = {}, o;

	//- alias
	for ( var key in user_conf.alias ) {
		if ( cmd_obj[ key ] ) continue;
		if ( ! cmd_obj[ user_conf.alias[ key ] ]) {
			_debug_log([ '���݂��Ȃ��R�}���h', key ], 'alias�ݒ�' );
		} else {
			cmd_obj[ key ] = cmd_obj[ user_conf.alias[ key ] ];
		}
	}
	user_conf.alias = {};

	//- main
	for ( var key in cmd_obj ) {
		//- ����Z�N�V����
		if ( key.charAt(0) == '_' ) {
			delete cmd_obj[ key ];
			continue;
		}
		o = cmd_obj[ key ];
		if ( _filetype_not_match( o ) ) continue;
		if ( group ) {
			if ( key.indexOf( group ) != 0 || group == key ) continue;
			key = key.substring( group.length );
		} else {
			if ( o.hidden && o.hidden.bool() ) continue;
		}
		item_set[ key ] = o.capt || o.cmd || o.open;
	}

	//- �R���}��؂蕶���񐶐�
	var item_set_string = '';
	for ( var key in item_set ) {
		item_set_string += ( key
			+ ( item_set[ key ] && key != item_set[ key ]
				? separator.capt1 + item_set[ key ] + separator.capt2
				: ''
			) ).replace( /;|,/g, '_' )
			+ ','
		;
	}
//	item_set_string = '';

	//... input
	var cmd_line = LoadDll( user_conf.path_macrodll ).EDIT_CREATE(
		GetCurrentWindowHandle(),
		item_set_string || 'no command',
		group
			? group + ( cmd_obj[ group ].capt && ' - ' + cmd_obj[ group ].capt )
			: title_script
//				 + ' (' + item_set_string.split(',').length + '�R�}���h)'
	);

	if ( ! cmd_line ) {
		_debug_log( '�G�X�P�[�v', '�R�}���h' );
		return true;
	}
	//- �R�}���h��  �L���v�V����;����
	var cmd_name = cmd_line.split_l( separator.capt1 ).split_l( separator.arg );
	var cmd_arg = cmd_line.split_r( separator.arg );

	if ( group )
		cmd_name = group + cmd_name;

	//... ���s
	//- �O���[�v�R�}���h
	if ( cmd_name.slice( -1 ) == '/' ) {
		_debug_log([ '�O���[�v�R�}���h', cmd_name ]);
		_cmd_input( cmd_name );
		return true;
	}
	
	//- ���s
	if ( _job( cmd_name, cmd_arg ) )
		return true;

	//... �s���ȃR�}���h����
	//- ���������X�N���v�g�t�@�C��������H
	if ( _exec_script( cmd_name, cmd_arg ) ) {
		_debug_log([ '�X�N���v�g���������̂ŊJ����', cmd_name ]);
		return true;
	}

	//- ���������t�H���_������H
	if ( cmd_line.is_folder() ) {
		_debug_log( '�t�H���_���������̂ŊJ����' );
		Open( cmd_line, 2 );
		return true;
	}
	cmd_name = cmd_name.env_expand();
	if ( cmd_name.is_folder() ||
		cmd_name.substring( 0, 2 ) == '\\\\' ||
		cmd_name.substring( 0, 6 ) == 'shell:'
	) {
		_debug_log( '�p�X���炵���̂ŊJ����' );
		Open( cmd_name, 2 );
		return true;
	}

	//- �h���C�u���H
	if ( cmd_name.length == 1 && ( cmd_name + ':\\' ).is_folder() ) {
		_debug_log( '�h���C�u���炵���̂ŊJ����' );
		Open( cmd_name + ':\\', 2 );
		return true;
	}
	_error([ '�s���ȃR�}���h', cmd_name ]);
}

//.. _menu
function _menu( item_set ) {
	var cmd_set ={}, menu_idx = 0;
	var o_dic = new ActiveXObject("Scripting.Dictionary");
	item_set = item_set.split( '\n' );
	
	//- �O���[�v�H
	if ( item_set.length == 3 && item_set[2].slice( -1 ) == '/' ) {
		var grp_name = item_set[2];
		item_set.pop();
		for ( name in cmd_obj ) {
			if ( name.indexOf( grp_name ) != 0 || name == grp_name ) continue;
			item_set.push( name );
		}
	}

	//- menu�쐬
	for ( var idx in item_set ) {
		var name = item_set[ idx ].split_l(',').trim();
		obj = cmd_obj[ name ];
		if ( _filetype_not_match( obj ) ) continue;
		++ menu_idx;
		if ( obj ) {
			acc_key = item_set[ idx ].split_r(',').trim()
				|| obj.key
				|| name.replace( /^.*\//, '' ).charAt(0) //- �O���[�v���͏����擪����
			;
			o_dic.add(
				menu_idx ,
				( obj.capt || obj.cmd || name ).trim()
				+ ( acc_key && "\t&" + acc_key.trim().toUpperCase() )
			);
		} else {
			o_dic.add(
				menu_idx ,
				( name == '-' ? "\x01" : '--- ' + name + ' ---' )
			);
		}
		cmd_set[ menu_idx ] = name;
	}
	_job( cmd_set[ menuArray( o_dic.Items() ) ] );
}

//.. _filetype_not_match
//- �g���q�̎w�肪����Ƃ��́A�}�b�`���Ȃ��ƕ\�����Ȃ�
function _filetype_not_match( o ) {
	if ( typeof o !== 'object' || ! ext_focused ) return;
	if ( o.ext ) {
		for ( var key in user_conf.ext_type )
			o.ext = ' ' + o.ext.replace( key, user_conf.ext_type[ key ] ) + ' ';
		return ! o.ext.has( ' ' + ext_focused + ' ' );
	} else {
		return o.file_only && o.file_only.bool() && ext_focused == 'folder';
	}
}

//.. _job ���s
function _job( cmd_name, arg ) {
	var obj_hit = cmd_obj[ cmd_name ];
	if ( ! obj_hit ) {
		_debug_log( '�s���ȃR�}���h����' );
		return false;
	}
	_debug_log( obj_hit, 'obj_hit' );

	if ( typeof obj_hit === "string" )
		obj_hit = { cmd: obj_hit };

	//- ���e��"-"�̃A�C�e���́A�R�}���h����
	for ( var key in obj_hit ) {
		if ( obj_hit[ key ] != '-' ) continue;
		obj_hit[ key ] = cmd_name;
	}

	//- ������tsv���Őݒ肳��Ă���
	if ( obj_hit.arg && ! arg ) {
		arg = obj_hit.arg.env_expand();
	}

	//... main
	var cmd_types = {
		js: function(){
			if ( ! arg && obj_hit.arg_input ) {
				arg = input(
					obj_hit.arg_input.split_l(',').trim(), 
					obj_hit.arg_input.split_r(',').trim()
				);
				if ( ! arg ) return true;
			}
			js_arg = arg; //- �O���[�o���ϐ��ɓ����
			try {
				Function( obj_hit.js )();
			}  catch( err ) {
				var msg = [
					'js�L�[�ɂ��JScript�����s�ŃG���[���������܂���' ,
					'�R�}���h��: ' + cmd_name
				];
				for ( var key in err )
					msg.push( key + ': ' + err[key] )
				_error( msg );
			}
		},
		open: function(){
			var items_open = obj_hit.open.split( '\n' );
			for ( var idx in items_open ) {
				_debug_log( items_open[idx], 'open' );
				Open( items_open[idx].env_expand(), arg || 2 );
			}
		},
		run: function() {
			_run( obj_hit.run, arg );
		},
		openby: function() {
			_run(
				obj_hit.openby,
				arg ? [ arg, focused.q() ] : focused.q()
			);			
		},
		openallby: function() {
			var args = arg ? [ arg ] : [];
			_foreach_selected(
				function( item ){ args.push( item.q() ); }, 
				obj_hit.num_limit || 5
			);
			_run( obj_hit.openallby, args );
		},
		openeachby: function() {
			var mode_wait = GetSelectedCount() < 2 ? null : 'wait';
			arg = arg ? arg + ' ' : '';
			_foreach_selected(
				function( each_selected ){
					_run( obj_hit.openeachby, arg + each_selected.q(), mode_wait );
				}, 
				obj_hit.num_limit || 5
			);
		},
		opendirby: function() {
			_run(
				obj_hit.opendirby,
				arg ? [ arg, GetDirectory().q() ] : GetDirectory().q()
			);			
		},
		tool: function() {
			if ( ! _exec_script( user_conf.path_tooljs, [ obj_hit.tool, arg ] )) {
				_error([ 'tool���������ł�', user_conf.path_tooljs ]);
			}
		},
		script: function() {
			if ( ! _exec_script( obj_hit.script, arg ) ) {
				_error([ '�X�N���v�g�t�@�C����������܂���', obj_hit.script ]);
			}
		},
		menu: function() {
			_menu(
				( obj_hit.capt || '���j���[: ' + cmd_name )
				+ '\n-\n'
				+ obj_hit.menu
			);
		},
		cmd: function() {
			Command( obj_hit.cmd )
		}
	};
	for ( var key in cmd_types ) {
		if ( ! obj_hit[ key ] ) continue;
		cmd_types[ key ]();
		return true;
	}
	_error([ '�o�^�R�}���h�̎��s���e����`����Ă��܂���', cmd_name ]);
}

//.. _load_tsv
function _load_tsv( fn ) {
	var lines = loadTextFile( fn ).split( "\n" );
	var cell = [], sec_name = '_dummy', key, val, data = {};
	for ( var idx in lines ) {
		cell = lines[ idx ].split( '\t', 2 );
		key = cell[0].trim();
		if ( ! key || key.charAt(0) == '.' || key.charAt(0) == ';' )
			continue;
		val = cell[1] ? cell[1].trim() : '';
		if ( key == '@' ) {
			sec_name = val;
			data[ sec_name ] = {};
			continue;
		} else {
			if ( data[ sec_name ][ key ] )
				data[ sec_name ][ key ] += '\n' + val;
			else
				data[ sec_name ][ key ] = val;
		}
	}
	return data;
}

