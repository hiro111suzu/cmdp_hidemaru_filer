//. init
var actx = {
	fs: new ActiveXObject( "Scripting.FileSystemObject" ) ,
	shell: new ActiveXObject( "WScript.Shell" )
};
var focused = GetItemCount() && GetItemPath( GetNextItem(-1,1) );

//. string 拡張
//- 親ディレクトリ
String.prototype.parent = function(){
	return actx.fs.GetParentFolderName( this );
}

//- basename
String.prototype.basename = function(){
	return actx.fs.GetBaseName( this );
}

//- フルパスに
String.prototype.fullpath = function( ext ){
	return GetDirectory() + '\\' + this + ( ext ? '.' + ext : '' );
}

//- 拡張子
String.prototype.ext = function(){
	return actx.fs.GetExtensionName( this );
}

// is_file
String.prototype.is_file = function(){
	return actx.fs.FileExists( this );
}

// is_folder
String.prototype.is_folder = function(){
	return actx.fs.FolderExists( this );
}
//- quote
String.prototype.q = function( rep_to ){
	return '"' + this.replace( /"/g, rep_to || '""' )  + '"';
}
//- has
String.prototype.has = function( str ){
	return this.indexOf( str ) != -1;
}
//- add_wildcard
String.prototype.add_wildcard = function() {
	return this.has( '*' ) ? this : '*' + this + '*' 
}
//- trim
String.prototype.trim = function() {
	return this.replace( /^\s+|\s+$/g, '' );
}
//- env_expand
String.prototype.env_expand = function() {
	var str = this;
	if ( path ) for ( var key in path ) {
		str = str.replace( '%' + key + '%', path[ key ] );
	}
	return actx.shell.ExpandEnvironmentStrings( str );
}
//- bool
String.prototype.bool = function() {
	return this && ' yes y true 1 '.has( ' ' + this.toLowerCase() + ' ' );
}

String.prototype.split_l = function( sep ) {
	return this.split( sep, 2 )[0];
}
String.prototype.split_r = function( sep ) {
	return this.substring( this.split( sep, 2 )[0].length + sep.length );
}

//. func 汎用
//.. _run
function _run( cmd, arg, option ) {
	if ( arg && typeof arg != "string" )
		arg = arg.join(' ');
	option += ' ';
	var cmd = _exe_path( cmd.env_expand() ).q() + ( arg && ' ' + arg );
	_debug_log( cmd, '_run' );
	actx.shell.Run(
		cmd ,
		option.has( 'hide' ) ? 0 : 1 ,
		option.has( 'wait' )
	);
}

//.. _exe_path
function _exe_path( name ) {
	if ( name.has(':') || name.is_file() ) return name;
	var has_dot = name.has('.');
	var fullpath;
	for ( var i in user_conf.exe_path ) {
		fullpath = user_conf.exe_path[i].env_expand()
			+ '\\'
			+ ( has_dot ? name : name + '\\' + name + '.exe' )
		;
		if ( fullpath.is_file() ) {
			_debug_log([ name, fullpath ], '_exe_path' );
			return fullpath;
		}
	}
	return name;
}

//.. _exec_script
function _exec_script( name, args ) {
	var fn_script = _find_script( name );
	if ( fn_script ) {
		sleep( 50 );
		_run( FullName, "/m3 /x "
			+ fn_script.q() //- script 名
			+ ( args && ' /a ' + ( typeof args == "string"
				? args
				: args.join( ' /a ' )
			))
		);
		return true;
	}
}

//.. _find_script
function _find_script( name ) {
	var s = name.env_expand();
	var p = scriptFullName.parent();
	var path_set = [
		s ,
		p + '\\' + s ,
		p.parent() + '\\' + s ,
		p.parent() + '\\' + s + '\\' + s
	];
	var ext_set = [ '', '.js', '.vbs' ];
	for ( var num in path_set ) for ( var num2 in ext_set ) {
		var fn_script = path_set[ num ] + ext_set[ num2 ];
		if ( fn_script.is_file() ) return fn_script;
	}
}


//.. _error
function _error( msg, program_name ) {
	_debug_log( msg, 'エラーメッセージ' );
	message(
		( title_script || scriptFullName.basename() ) + '\n'
		+ ( typeof msg == 'string' ? msg : msg.join('\n') )
		, 
		48 //- 注意メッセージアイコン
	);
	endMacro();
}

//.. _test
function _test( str ) {
	str = typeof str == 'string' ? str : str.join('\n');
	if ( ! Question( str + '\n\n「いいえ」で終了' ) ) endMacro();
}

//.. _selected
function _selected() {
	var ret = [];
	for (
		var idx = GetNextItem(-1,2);
		idx >= 0;
		idx = GetNextItem( idx, 2 )
	){
		ret.push( GetItemPath( idx ) );
	}
	return ret;
}

//.. _foreach_selected
/*
	break: return true;
	continue: return false;
*/
function _foreach_selected( func, num_limit ) {
	var num_selected = GetSelectedCount();
	num_limit = num_limit || 5;
	//- 選択なしならフォーカスアイテム
	if ( num_selected == 0 ) {
		func( focused );
	}
	if (
		num_limit <= num_selected
		&& ! Question( num_selected + '個のアイテムが選択されています\n実行しますか？' )
	){
		return;
	}
	var item_list = _selected();
	//- 処理を分けないと、タブが切り替わったときに止まってしまう
	for ( var key in item_list ) {
		if ( func( item_list[ key ] )) break;
	}
}

//.. _JSON_encode
function _JSON_encode( obj ){
	var htmlfile = new ActiveXObject( 'htmlfile' );
	htmlfile.write( '<meta http-equiv="x-ua-compatible" content="IE=11">' );
	return htmlfile.parentWindow.JSON.stringify( obj );
}

//.. _baloon
function _baloon( msg, mseq ) {
	_run( 'hmbaloontoast', msg.q() + ' ' + ( mseq || 30000 ) );
}

//.. _debug_log
function _debug_log( val, key ) {
	if ( ! user_conf || ! user_conf.debug_soft ) return;
	if ( ! val ) { //- 開始
		if ( ! user_conf.debug_soft.is_file() ) {
			message( 'debug_softの実行ファイルがありません\n' + user_conf.debug_soft  );
			user_conf.debug_soft = null;
			return;
		}
		val = '開始';
	}
	var type = typeof val;
	actx.shell.run(
		user_conf.debug_soft + ' '
		+ (
			'[' + scriptFullName.basename() + '] '
			+ ( key ? key +  '(' + type + ')\r\n' : '' )
			+ ( type == 'object' ? _JSON_encode( val ) : val )
		).q() ,
		0 //- hide
	);
}

//.. _merge_obj
function _merge_obj( obj1, obj2 ) {
	for ( var key in obj2 )
		obj1[ key ] = obj2[ key ];
	return obj1;
}

