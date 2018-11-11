## Web-based, Multiplayer, Real-time, Multiple-choice Quiz with Node.js

![Screenshot](https://user-images.githubusercontent.com/14981676/48313771-8b72fc00-e5da-11e8-9f1a-0426a54f7399.png)

### Features
- Multiplayer: Connect dozens of players from PC/mobile to participate in the quiz
- Responsive, real-time (socket.io) web-based interface
- Support for multiple-choice questions
- Support images in questions
- Participate as audience or as official participant (requiring players to use a quiz code to authenticate)
- Participate as spectator
- Real-time leaderboard
- Admin control through web interface

### Install dependencies
```
npm install
```

### Quiz setup
- Create a folder with your quiz name (alphanumeric, no spaces) under `quizzes`.
- Create a text file named `questions.txt` under the new folder.
- Write your questions in `questions.txt` following the same format as existing quizzes (e.g. `quizzes/test/questions.txt`)
- You can also configure various parameters such as the `Quiz title`, `Quiz logo`, `Admin password` and `Quiz code` from `questions.txt`
- All images need to be put under `public/content/<quiz name>/`

### Run server
```
node app.js
```

### Connect
- Open your web browser at http://localhost:3000
- Select your quiz
- Authenticate as admin/official participant/audience participant/spectator
