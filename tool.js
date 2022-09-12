//. init
try {
	eval( loadTextFile( ScriptFullName.replace( /\\[^\\]+\.js$/, '\\common.js' ) ) );
} catch( err ) {
	var msg = [ 'common.js���ŃG���[����' ];
	for ( var key in err )
		msg.push( key + ': ' + err[key] )
	message( msg.join('\n') );
}
var title_script = '�R�}���h�p���b�g �c�[���X�N���v�g';

var user_conf = {
	exe_path: [
	 	'%PROGRAMFILES%'.env_expand() ,
	 	'%PROGRAMFILES(X86)%'.env_expand() ,
	 	'c:\\tools'
	] ,
	debug_soft: ''
};
var path = {};

//. main
var arg = [ getArg(0).trim(), getArg(1) ];
if ( arg[0] == '' ) {
	var inp = input(
		'tool�X�N���v�g\n�c�[�����i�֐����j �����i�ȗ��j����� ',
		'tool_test hoge'
	);
	arg = inp.split(' ');
	arg[1] = inp.substring( arg[0].length + 1 );
	arg[0] = arg[0].trim();
}

if ( eval( 'typeof ' + arg[0] ) != 'function' )
	_error([ '��`����Ă��Ȃ��֐������󂯎��܂���', arg[0] ]);
Function( arg[0] + '( arg[1] )' )();

endMacro();

//. ���[�U�[��`�֐�
//.. tool_test
function tool_test( arg ) {
	message( 'tool�X�N���v�g�̃e�X�g\n����: ' + arg );
}

//.. change_ext �g���q�ύX
function change_ext( arg ) {
	var selected = _selected();
	if ( 1 < selected.length ) {
		change_ext_multi( selected, arg );
		return;
	}
	if ( !focused.is_file() ) {
		message( '�g���q�̕ύX: �t�@�C���ł͂���܂���' );
		return;
	}
	var cur_ext  = focused.ext();
	var basename = focused.basename();
	var new_ext = arg || input( '�g���q�̕ύX: ' + basename, cur_ext );
	if ( ! new_ext || new_ext == cur_ext ) return;
	var fn_new = basename.fullpath( new_ext );
	if ( fn_new.is_file() ) {
		message( '���łɑ��݂���t�@�C�����Ɠ����ɂȂ�܂�'
			 + '\n' + basename + '.' + new_ext );
	} else {
		actx.fs.MoveFile( focused, fn_new );
	}
}

//.. change_ext_multi �g���q�ύX ����
function change_ext_multi( selected, arg ) {
	var new_ext = arg || input(
		'�g���q�̕ύX:\n ' + selected.length + '�̃A�C�e��',
		focused.ext()
	);
	if ( ! new_ext ) return;
	var pn;
	for ( var i in selected ) {
		pn = selected[i];
		if ( ! pn.is_file() ) continue;
		if ( new_ext == pn.ext() ) continue;
		actx.fs.MoveFile( pn, pn.basename().fullpath( new_ext ) );
	}
}

//.. close_by_kw
function close_by_kw( arg ) {
	arg = arg || input( '�L�[���[�h�Ƀq�b�g�����^�u�����' );
	if ( ! arg ) return;
	var count_alltabs = getTabCount( -2 );
	for ( var idx = 0; idx < count_alltabs; idx ++ ) {
		if ( !
			( getTabName( idx, 1 ) + ' ' + getTabName( idx ) )
			.toLowerCase().has( arg.toLowerCase() ) 
		) continue;
		if ( ! closeTab( idx ) ) {
			setActiveTab( idx );
			command( '�^�u�����b�N' );
			if ( ! closeTab( idx ) )
				continue;
		}
		-- idx;
		-- count_alltabs;
	}
}

//.. �ŐV�̏��ɍX�V+
function refresh_plus() {
	var tab_name0 = GetTabName( GetCurrentTab() ).charAt(0);
	if ( tab_name0 == '?' ) {
		_exec_script( 'searchkit', 'refresh' );
		endMacro();
	} else if ( tab_name0 == '*' ) {
		closeTab( GetCurrentTab() );
		_run( 'hidemaru', ' /m3 /x hidehist\\hidehist.mac' );
		endMacro();
	} else {
		Command( '�t�B���^��S�ĉ���' );
		Command( '�ŐV�̏��ɍX�V' );
	}
}

//.. zip
function zip() {
	_run(
		'7-Zip\\7zG.exe' ,
		'a ' + ( focused + '.zip' ).q() + ' ' + (
			focused.is_folder() ? focused + '\\*' : focused
		).q() ,
		'wait'
	);
}

//.. filter_plus �t�B���^�[�E�Č���
function filter_plus( arg ) {
	var tab_name = GetTabName( GetCurrentTab() );

	//- �����^�u
	if ( tab_name.charAt(0) == '?' ) {
		_exec_script( 'searchkit', 'filter' );
		endMacro();
	}

	//... �ʏ�^�u
	var filt = arg ||
		input( '�t�B���^������', GetWildcard().replace( /^\*(.+)\*$/, '$1' ) )
	;

	var flg_slash = false;
	if ( filt && filt.charAt(0) == '/' ) {
		flg_slash = true;
		filt = filt.substring(1);
	}

	if ( ! flg_slash ) {
		if ( !filt ) {
			Command( '�t�B���^��S�ĉ���' );
			return;
		}
		Open( filt.add_wildcard() );
	} else {
		if ( !filt ) return;
		SelectItem( filt.add_wildcard() );
		SetSpaceSelectMode(1);
	}
}

//.. mdfilt
function mdfilt() {
	var filt = input( '�t�B���^������',
		GetWildcard().replace( /^\*(.+)\*$/, '$1' )
		||
		focused.basename().replace( / v[0-9][0-9].*$/, '' )
	);
	if ( ! filt ) return;
	Open( filt.add_wildcard() );
	Command( '���ׂđI��' );
	dir_full_path = filt.fullpath();
	actx.fs.CreateFolder( dir_full_path );
	SendTo( dir_full_path, 4 );
}

