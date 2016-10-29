var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var express_session = require("express-session")({
    secret: "c60ebe0a696ee406ad598621c0a70c15",
    resave: true,
    saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");
require('string.prototype.startswith');

var Entities = require('html-entities').XmlEntities;
var entities = new Entities();

var fs = require('fs');
eval(fs.readFileSync('quiz.js')+'');

app.use(express_session);
app.use(express.static('public'));
io.use(sharedsession(express_session, {autoSave:true} ));

var quizzes = new Quizzes();

app.get('/quiz/:quiz_id', function(req, res){
	try{
		var quiz_id = req.params.quiz_id;
		
		if(!quizzes.isValidQuizId(quiz_id)){
			res.redirect('/');
		}
		else{
			req.session.quiz_id = quiz_id;
			res.redirect('/connect.html');
		}
	}
	catch(e){
		console.log(e);
		console.trace();
	}
});

var isAdmin = function(socket,session){
	if(!session.ready_for_quiz){
		socket.emit('quiz_init_nok');		
		return false;
	}
	
	var participantId = session.participantId;
	var participant = quizzes.getParticipant(session.quiz_id,participantId);
	
	if(!(participant.isAdministrator)){
		socket.emit('quiz_init_nok');		
		return false;			
	}
	
	return true;
}

io.on('connection', function(socket){
	try{
		var session = socket.handshake.session;
		
		/*index.html*/
		socket.on('index_init',function(data){
			socket.emit('index_init_ok',quizzes.getList());
		});
		
		/*connect.html*/	
		socket.on('connect_init',function(data){
			var quiz_id = session.quiz_id;
			
			if(session.ready_for_quiz) socket.emit('connect_init_ok_ready_quiz');
			else if(!quizzes.isValidQuizId(quiz_id)) socket.emit('connect_init_nok')
			else{
				var quiz_details = quizzes.getQuizDetails(quiz_id);
				var quiz_desc = quiz_details.desc;
				var quiz_pic = quiz_details.pic;

				socket.emit('connect_init_ok',{quiz_desc:quiz_desc,quiz_pic:quiz_pic});
			}
		});
		
		socket.on('connect_connect',function(data){
			var type = data.type;
			
			var participant;
			
			if(type=='official' || type=='unofficial'){
				var team_name = data.team_name;
				if(team_name) team_name = team_name.toUpperCase();
				
				if(!quizzes.isValidTeamname(session.quiz_id,team_name)){
					socket.emit('connect_connect_nok_invalid_team_name');
					return;
				}	
				
				if(type=='official'){
					var quiz_code = data.quiz_code;
					
					if(!quizzes.isValidQuizCode(session.quiz_id,quiz_code)){
						socket.emit('connect_connect_nok_invalid_quiz_code');
						return;
					}
					else{
						participant = new OfficialParticipant(socket,team_name);
					}
				}
				else if(type=='unofficial'){
					participant = new UnofficialParticipant(socket,team_name);
				}
			}
			else if(type=='spectator'){
				participant = new Spectator(socket);
			}
			else if(type=='admin'){
				var admin_password = data.admin_password;
				
				if(quizzes.isValidAdminPassword(session.quiz_id,admin_password)){
					participant = new Administrator(socket);
				}
				else{
					socket.emit('connect_connect_nok_invalid_admin_password');
					return;
				}
			}
			quizzes.addParticipant(participant);
			socket.emit('connect_connect_ok');
		});
		
		/*quiz.html*/
		socket.on('quiz_init',function(data){
			if(!session.ready_for_quiz){
				socket.emit('quiz_init_nok');		
				return;
			}
			
			var participantId = session.participantId;
			var participant = quizzes.getParticipant(session.quiz_id,participantId);
			
			socket.emit('quiz_init_ok',{userType: participant.getUserType() });
			
			participant.updateSocket(socket);
			quizzes.sendUpdates(participant);
		});
		
		socket.on('quiz_send_answer',function(data){
			if(!session.ready_for_quiz){
				socket.emit('quiz_init_nok');		
				return;
			}
			
			var participantId = session.participantId;
			var participant = quizzes.getParticipant(session.quiz_id,participantId);
			
			if(participant.isRealParticipant){
				quizzes.collectResponse(session.quiz_id,participant,data);
			}
		});
		
		socket.on('quiz_leave_quiz',function(data){
			session.ready_for_quiz = false;
			session.participantId = false;
			socket.emit('quiz_init_nok');
		});
		
		socket.on('quiz_get_leaderboard',function(data){
			if(!session.ready_for_quiz){
				socket.emit('quiz_init_nok');		
				return;
			}
			
			var participantId = session.participantId;
			var participant = quizzes.getParticipant(session.quiz_id,participantId);
					
			var leaderboard = quizzes.getLeaderboard(session.quiz_id);
			socket.emit('quiz_leaderboard',leaderboard);
		});
		
		/*admin functions*/
		socket.on('quiz_admin_start_quiz',function(data){
			if(isAdmin(socket,session)){
				quizzes.startQuiz(session.quiz_id);
			}
		});
		
		socket.on('quiz_admin_test_question',function(data){
			if(isAdmin(socket,session)){
				quizzes.showTestQuestion(session.quiz_id);
			}
		});
		
		socket.on('quiz_admin_next_question',function(data){
			if(isAdmin(socket,session)){
				quizzes.showNextQuestion(session.quiz_id);
			}
		});
		
		socket.on('quiz_admin_cancel_last_question',function(data){
			if(isAdmin(socket,session)){
				quizzes.cancelLastQuestion(session.quiz_id);
			}
		});
		
		socket.on('quiz_admin_end_quiz',function(data){
			if(isAdmin(socket,session)){
				quizzes.endQuiz(session.quiz_id);
			}	
		});
	}
	catch(e){
		console.log(e);
		console.trace();
	}
});

server.listen(3000);