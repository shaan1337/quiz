import os
import random

questions = []
answers = []

curQuestion = None
curAnswers = []

for directory in os.listdir("."):
    if directory == 'test':
        continue
    questionsFile = os.path.join(directory, "questions.txt")
    if os.path.exists(questionsFile):
        with open(questionsFile) as f:
            content = f.readlines()
            for i in range(len(content)):
                line = content[i].strip()
                if line.startswith('q '):
                    if curQuestion is not None:
                        questions.append(curQuestion)
                        answers.append(curAnswers)

                    curQuestion = line
                    curAnswers = []
                elif line.startswith('a ') or line.startswith('ac '):
                    if curQuestion is not None:
                        curAnswers.append(line)
                elif line.startswith('img '):
                    curQuestion = None
                    curAnswers = []

if curQuestion is not None:
    questions.append(curQuestion)
    answers.append(curAnswers)

index = [i for i in range(len(questions))]
random.shuffle(index)

with open("output.txt", 'w') as outputFile:
    for i in range(50):
        outputFile.write(questions[index[i]] + '\n')
        for j in range(len(answers[index[i]])):
            outputFile.write(answers[index[i]][j] + '\n')
        outputFile.write('\n')