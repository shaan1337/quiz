function Connect(){
	var socket = false;
	
	this.start = function(){
		socket = io();
		this.bindViewEvents();
		this.bindSocketEvents();
		socket.emit('connect_init');
	}
	
	this.bindSocketEvents = function(){
		socket.on('connect_init_ok',function(data){
			if(data.quiz_desc){
				$('#quiz_title').html('<h1>'+data.quiz_desc+'</h1>');
			}
			
			if(data.quiz_pic){
				$('#quiz_pic').html('<img src="'+data.quiz_pic+'"/>');
			}
		});
		
		socket.on('connect_init_nok',function(){
			location.href = '/';
		});
		
		socket.on('connect_init_ok_ready_quiz',function(){
			location.href = '/quiz.html';
		});
		
		socket.on('connect_connect_nok_invalid_quiz_code',function(){
			alert('Invalid quiz code!');
		});
		
		socket.on('connect_connect_nok_invalid_team_name',function(){
			alert('Invalid team name! Please try another one (must be at least 4 characters and not used by another team)');
		});
		
		socket.on('connect_connect_nok_invalid_admin_password',function(){
			alert('Invalid administrator password!');
		});
		
		socket.on('connect_connect_ok',function(data){
			location.href='quiz.html';
			
			return false;
		});		
		
	}
	
	this.bindViewEvents = function(){
		$('#btn_connect_unofficial').click(function(){
			socket.emit('connect_connect',{type:'unofficial',team_name:$('#unofficial_team_name').val()});			
			return false;
		});
		
		$('#btn_connect_official').click(function(){
			socket.emit('connect_connect',{type:'official',team_name:$('#official_team_name').val(),quiz_code:$('#official_quiz_code').val()});
			return false;
		});

		$('#btn_connect_spectator').click(function(){
			socket.emit('connect_connect',{type:'spectator'});
			return false;
		});
		
		$('#btn_admin_connect').click(function(){
			socket.emit('connect_connect',{type:'admin',admin_password:$('#admin_password').val()});
			return false;
		});	
	}
}

$(document).ready(function(){
	var connect = new Connect();
	connect.start();
});