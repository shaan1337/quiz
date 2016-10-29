function GameWorld(){
	var states = {START:0,TEST_QUESTION:1,STARTING:2,SHOW_QUESTION:3,SHOW_ANSWER:4,END:5};
	var socket = false;
	
	var userType = false;
	var selectedAnswerId = false;
	var curState = false;
	var savedState = false;
	
	this.init = function(){
		this.initSocket();
		this.initializeView();
		this.bindViewEvents();
		this.bindSocketEvents();		
		
		socket.emit('quiz_init');
	}
	
	this.initSocket = function(){
		socket = io.connect({'reconnection':true,'reconnectionDelay': 1000,'reconnectionDelayMax' : 1000,'reconnectionAttempts': 1000});
	}
	
	this.initializeView = function(){
		$('#timer_area').hide();
		$('#question_area').hide();
		$('#admin_area').hide();
	}
	
	this.showAreasBasedOnRoleAndState = function(state,stateParams){
		$('.element').hide();
		
		/*All users, all states*/
		$('#controlpanel_area').show();
		$('#generic_options_area').show();
		
		if(state==null && stateParams.leaderboard && $('#btn_show_leaderboard').attr('show_leaderboard')==null){				
				state = savedState;
		}
		
		/*All users, some states*/
		if(state==null && stateParams.leaderboard && $('#btn_show_leaderboard').attr('show_leaderboard')){
				$('#leaderboard_area').show();
				savedState = curState;
		}
		else if(state==states.TEST_QUESTION || state==states.SHOW_QUESTION || state==states.SHOW_ANSWER){
			$('#timer_area').show();
			$('#question_area').show();
		}
		else if(state==states.START || state==states.STARTING || state==states.END){
			$('#wait_area').show();
		}
		

		
		if(userType=='official_participant' || userType=='unofficial_participant'){
			/*All states*/
			$('#participant_area').show();
		}
		else if(userType=='admin'){
			/*Before start*/
			if(state==states.SHOW_QUESTION){
				$('#admin_area_after_start').show();
			}
			else if(state==states.START || state==states.STARTING || state==states.END || state==states.TEST_QUESTION){
				$('#admin_area_before_start').show();
			}
			else if(state==states.SHOW_ANSWER){
				$('#admin_area_show_answer').show();
			
				if(stateParams && stateParams.test) $('#admin_area_before_start').show();
				else $('#admin_area_after_start').show();
			}
		}
		else if(userType=='spectator'){

		}
	}
	
	this.bindViewEvents = function(){
		$('#btn_admin_test_question').click(function(e){
			socket.emit('quiz_admin_test_question');
			return false;
		});
		
		$('#btn_admin_start_quiz').click(function(e){
			socket.emit('quiz_admin_start_quiz');
			return false;
		});
		
		$('#btn_admin_next_question').click(function(e){
			socket.emit('quiz_admin_next_question');
			return false;
		});
		
		$('#btn_admin_cancel_last_question').click(function(e){
			if(confirm("Are you sure you want to cancel the last question?")){
				if(confirm("Are you really sure?")){
					socket.emit('quiz_admin_cancel_last_question');
				}
			}
			
			return false;
		});
		
		$('#btn_admin_end_quiz').click(function(e){
			if(confirm("Are you sure you want to end the quiz?")){
				if(confirm("Are you really sure?")){
					socket.emit('quiz_admin_end_quiz');
				}
			}
			
			return false;
		});
		
		$('#btn_leave_quiz').click(function(e){
			if(confirm("Are you sure you want to leave the quiz? All your data will be lost. (score, etc.)")){
				if(confirm("Are you really sure?")){
					socket.emit('quiz_leave_quiz');
				}
			}
			
			return false;
		});
		
		$('#btn_show_leaderboard').click(function(gameWorld){
			return function(e){
				var show = $('#btn_show_leaderboard').attr("show_leaderboard");

				if(show!=null){
					$('#leaderboard_area').hide();
					$('#btn_show_leaderboard').attr("show_leaderboard",null);
					$('#btn_show_leaderboard').html('Show Leaderboard');
				}
				else{
					socket.emit('quiz_get_leaderboard');
					$('#btn_show_leaderboard').attr("show_leaderboard",true);
					$('#btn_show_leaderboard').html('Hide Leaderboard');				
				}
				
				gameWorld.showAreasBasedOnRoleAndState(null,{leaderboard:true});
			};
		}(this)
		);
		
	}
	
	this.bindSocketEvents = function(){
		socket.on('quiz_init_ok',function(gameWorld){
			return function(data){
				userType = data.userType;
				gameWorld.showAreasBasedOnRoleAndState(states.START,{});
			};
		}(this));
		
		socket.on('quiz_init_nok',function(data){
			location.href = '/';
		});
		
		socket.on('quiz_state_update',function(gameWorld){
			return function(data){
				var state = data.state;		
				var stateParams = data.stateParams;
				
				//if receiving updates from the server, hide the leaderboard
				if($('#btn_show_leaderboard').attr('show_leaderboard')){
					$('#btn_show_leaderboard').trigger("click");				
				}
				
				gameWorld.showAreasBasedOnRoleAndState(state,stateParams);
				curState = state;
				
				gameWorld.updateGeneralParams(stateParams);
				
				if(state == states.START){
					gameWorld.start(stateParams);
				}
				else if(state == states.TEST_QUESTION){
					gameWorld.showQuestion(stateParams);
				}				
				else if(state == states.STARTING){
					gameWorld.starting(stateParams);
				}
				else if(state == states.SHOW_QUESTION){
					gameWorld.showQuestion(stateParams);
				}
				else if(state == states.SHOW_ANSWER){
					gameWorld.showAnswer(stateParams);
				}
				else if(state == states.END){
					gameWorld.end(stateParams);
				}
			};
		}(this)
		);
		
		socket.on('quiz_leaderboard',function(data){			
			var html = "";
			html += "<div>";
			
			var types = ['official','unofficial'];
			var names = {
				'official' : 'Official Participants',
				'unofficial' : 'Audience Participants'
			};
			
			for(var t in types){
				var participantsType = types[t];
				var name = names[participantsType];
				var elements = data[participantsType];
				
				html += "<h1>" + name + "</h1>";				
				html += "<table class='table table-hover table-condensed table-striped table-bordered' style='width:80%; font-size: 1.8em'>";
				
				html += "<thead>";
				html += "<tr>";
				html += "<th style='width:50px' >" + "Rank" + "</th>" + "<th>" + "Team" + "</th>" + "<th>" + "Score" + "</th>";
				html += "</tr>";
				html += "</thead>";
				
				html += "<tbody>";
				
				for(var elem in elements){
					var p = elements[elem];
					
					var colorStyle = "";
					if(p.isLastCorrect === true){
						colorStyle = "background-color: rgb(133, 255, 135)";
					}
					else if(p.isLastCorrect === false){
						colorStyle = "background-color: rgb(255, 162, 162)";
					}
					
					html += "<tr style='"+colorStyle+"'>";
					html += "<td>" + p.rank + "</td>" + "<td>" + p.team + "</td>" + "<td>" + p.score + "</td>";
					html += "</tr>";
				}
				
				html += "</tbody>";
				
				html += "</table>";
			}
			
			console.log(html);
			
			$('#leaderboard_area').html(html);			
		});
	}
	
	this.setWaitStatus = function(text){
		$('#wait_status').html(text);
	}
	
	this.start = function(stateParams){		
		this.setWaitStatus('Get ready!');
	}
	
	this.starting = function(stateParams){
		this.setWaitStatus('Starting... Good luck and have fun!');
	}
	
	this.showQuestion = function(stateParams){		
		$('#answer_status').html("");
		if(stateParams.pic!='') $('#question_area .pic').html("<img style='max-width: 500px; width:100%' src='"+stateParams.pic+"' />");
		else $('#question_area .pic').html('');
		
		$('#question_area .question').html(stateParams.question + ' (' + stateParams.marks + ')' );
		
		var answers = stateParams.answers;				
		$('#question_area .answers').html("");
		
		selectedAnswerId = false;
		
		for(var i=0;i<answers.length;i++){
			var curLetter = String.fromCharCode(65 + i);
			var answerId = (i+1);
			
			var $div = $("<div>", { answer_id:answerId })
			.attr("style","font-size:2em; padding-top: 10px; border: 1px solid; margin-top: 2px; overflow:hidden; cursor: pointer; cursor: hand; ")
			.addClass("answer_"+answerId)
			.append("<span/>")
			.text(curLetter+'. '+answers[i]);
			
			$div.click(function(){
				if((userType=='official_participant' || userType=='unofficial_participant') && (curState==states.SHOW_QUESTION || curState==states.TEST_QUESTION)){
					selectedAnswerId = $(this).attr("answer_id");
					socket.emit('quiz_send_answer',{answerId:selectedAnswerId});
					
					$('#question_area .answers div').css("background-color","inherit");			
					$(this).css("background-color","rgb(255, 255, 162)");
				}
			});
			
			$("#question_area .answers").append($div);			
		}
		
		var d = new Date();
		d.setSeconds(d.getSeconds()+stateParams.time);
		
		$('#timer').countdown({
			until: d,
			format: 'S',
			labels: ['', '', '', '', '', '', ''],
			labels1: ['', '', '', '', '', '', ''],
			onExpiry: function(){				
				$(this).countdown('destroy');
			}
		});
	}

	this.showAnswer = function(stateParams){
		this.setWaitStatus('Waiting for next question...');
		$('#timer').countdown('destroy');
	
		var correctAnswerId = stateParams.answerId;
		var isTest = stateParams.test;
		
		var correctAnswer = false;
		if(correctAnswerId == selectedAnswerId){
			correctAnswer = true;
		}
				
		if(!correctAnswer && selectedAnswerId!=false){	
			$('#question_area .answer_'+selectedAnswerId).css("background-color","rgb(255, 162, 162)");	
		}

		$('#question_area .answer_'+correctAnswerId).css("background-color","rgb(133, 255, 135)");

		if(userType=='official_participant' || userType=='unofficial_participant'){
			if(correctAnswer){
				$('#answer_status').html("Correct answer!");
			}
			else{
				$('#answer_status').html("<span style='color:#f00'>Incorrect answer!</span>");
			}
		}
		else{
			$('#answer_status').html("<span style='color:#f00'>Time over!</span>");
		}
	}

	this.end = function(stateParams){
		this.setWaitStatus('Thanks for your participation!');
	}
	
	this.updateGeneralParams = function(stateParams){
		if(stateParams && stateParams.rank){
			var rank = stateParams.rank;
			$('#participant_rank').html('Rank: '+rank);
		}
	}
}

$(document).ready(function(){
	var gameWorld = new GameWorld();
	gameWorld.init();
});