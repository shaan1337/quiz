function Index(){
	var socket = false;
	
	this.start = function(){
		socket = io();
		this.bindSocketEvents();
		socket.emit('index_init');
	}
	
	this.bindSocketEvents = function(){
		socket.on('index_init_ok',function(data){
			var html = "";
			
			for(var i in data){
				var q = data[i];
				
				html += "<div><a href='"+q.link+"'>* "+q.quiz+"</a></div>";
			}
			
			$('#quiz_list_area').html(html);
		});
	}
}

$(document).ready(function(){
	var index = new Index();
	index.start();
});