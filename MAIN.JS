import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC85e1DeiY_cq2os7dqKWcrfLmzMcOS-0E",
    authDomain: "find-flag-abf52.firebaseapp.com",
    projectId: "find-flag-abf52",
    storageBucket: "find-flag-abf52.firebasestorage.app",
    messagingSenderId: "366974416189",
    appId: "1:366974416189:web:fa9a9ac81557a0ad8ac154"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const startBtn = document.querySelector(".js-start-btn");
const nameInput = document.querySelector(".js-player-name");
const gameSection = document.querySelector(".game");
const playerForm = document.querySelector(".player-form");
const flagImg = document.querySelector(".js-flag");
const answersList = document.querySelector(".js-answers");
const scoreEl = document.querySelector(".js-score");
const timerEl = document.querySelector(".js-timer");
const questionCountEl = document.querySelector(".js-question-count");
const leaderboardSection = document.querySelector(".js-leaderboard");
const finalScoreEl = document.querySelector(".js-final-score");
const restartBtn = document.querySelector(".js-restart-btn");
const leaderboardList = document.querySelector(".js-leaderboard-list");
const template = document.getElementById("answer-template");

const API = "https://restcountries.com/v3.1/all?fields=name,flags";
const MAX_QUESTIONS = 10;
const TIME_PER_QUESTION = 15;

let playerName = "";
let countries = [];
let score = 0;
let correctAnswer = "";
let timer = null;
let time = TIME_PER_QUESTION;
let questionCount = 0;
let isAnswered = false;

const correctSound = new Audio("correct(1).mp3");
const wrongSound = new Audio("wrong(1).mp3");

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);

nameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") startGame();
});

async function startGame() {
    playerName = nameInput.value.trim();
    
    if (!playerName) {
        alert("Enter name");
        return;
    }

    score = 0;
    questionCount = 0;
    
    playerForm.classList.add("hidden");
    gameSection.classList.remove("hidden");
    leaderboardSection.classList.add("hidden");
    
    scoreEl.textContent = `Score: ${score}`;
    questionCountEl.textContent = `Question: ${questionCount}/${MAX_QUESTIONS}`;
    
    await loadCountries();
}

async function loadCountries() {
    try {
        const response = await fetch(API);
        countries = await response.json();
        newQuestion();
    } catch (error) {
        console.error("Error loading countries:", error);
        alert("Error loading game data. Please refresh the page.");
    }
}

function newQuestion() {
    if (questionCount >= MAX_QUESTIONS) {
        endGame();
        return;
    }

    isAnswered = false;
    questionCount++;
    time = TIME_PER_QUESTION;
    
    questionCountEl.textContent = `Question: ${questionCount}/${MAX_QUESTIONS}`;
    timerEl.textContent = `Time: ${time}`;
    
    clearInterval(timer);
    
    const correctCountry = countries[Math.floor(Math.random() * countries.length)];
    correctAnswer = correctCountry.name.common;
    
    flagImg.src = correctCountry.flags.png;
    flagImg.alt = `Flag of ${correctAnswer}`;
    
    const options = [correctAnswer];
    
    while (options.length < 4) {
        const rand = countries[Math.floor(Math.random() * countries.length)].name.common;
        if (!options.includes(rand)) {
            options.push(rand);
        }
    }
    
    options.sort(() => Math.random() - 0.5);
    
    renderAnswers(options);
    
    startTimer();
}

function renderAnswers(options) {
    answersList.innerHTML = "";
    
    const fragment = document.createDocumentFragment();
    
    options.forEach(option => {
        const clone = template.content.cloneNode(true);
        const btn = clone.querySelector(".js-answer-btn");
        
        btn.textContent = option;
        btn.dataset.answer = option;
        btn.addEventListener("click", checkAnswer);
        
        fragment.appendChild(clone);
    });
    
    answersList.appendChild(fragment);
}

function startTimer() {
    timer = setInterval(() => {
        time--;
        timerEl.textContent = `Time: ${time}`;
        
        if (time <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    if (isAnswered) return;
    isAnswered = true;
    
    wrongSound.play().catch(() => {});
    
    const buttons = answersList.querySelectorAll(".js-answer-btn");
    buttons.forEach(btn => {
        btn.disabled = true;
    });
    
    setTimeout(newQuestion, 1500);
}

function checkAnswer(e) {
    if (isAnswered) return;
    isAnswered = true;
    
    clearInterval(timer);
    
    const selectedAnswer = e.target.dataset.answer;
    const buttons = answersList.querySelectorAll(".js-answer-btn");
    
    buttons.forEach(btn => {
        btn.disabled = true;
    });
    
    if (selectedAnswer === correctAnswer) {
        score += 10 + time;
        correctSound.play().catch(() => {});
    } else {
        wrongSound.play().catch(() => {});
    }
    
    scoreEl.textContent = `Score: ${score}`;
    
    setTimeout(newQuestion, 1500);
}

async function endGame() {
    gameSection.classList.add("hidden");
    leaderboardSection.classList.remove("hidden");
    
    finalScoreEl.textContent = `${playerName}, your score: ${score}`;
    
    try {
        await addDoc(collection(db, "scores"), {
            name: playerName,
            score: score,
            date: new Date()
        });
        
        const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        leaderboardList.innerHTML = "";
        let index = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            index++;
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${index}. ${data.name}</span>
                <span>${data.score}</span>
            `;
            leaderboardList.appendChild(li);
        });
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

function restartGame() {
    playerForm.classList.remove("hidden");
    leaderboardSection.classList.add("hidden");
    nameInput.value = "";
    nameInput.focus();
}