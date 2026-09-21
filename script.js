/* =========================
   PAGE NAVIGATION
========================= */

function showPage(pageName, button) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(function(page) {

        page.classList.remove("active");

    });


    document
        .getElementById(pageName)
        .classList.add("active");


    const buttons =
        document.querySelectorAll(".menu-btn");

    buttons.forEach(function(btn) {

        btn.classList.remove("active");

    });


    button.classList.add("active");

}


/* =========================
   DARK MODE
========================= */

function toggleTheme() {

    document.body.classList.toggle("dark");

}


/* =========================
   NEW CHAT
========================= */

function newChat() {

    document.getElementById(
        "chatMessages"
    ).innerHTML = `

        <div class="welcome">

            <div class="ai-logo">
                ✦
            </div>

            <h1>
                How can I help you learn?
            </h1>

            <p>
                Ask me anything about your studies.
            </p>

        </div>


        <div class="suggestions">

            <button
                onclick="askQuestion('Explain C++ pointers in simple language')"
            >

                💡

                <div>

                    <b>
                        Explain a concept
                    </b>

                    <small>
                        Explain C++ pointers
                    </small>

                </div>

            </button>


            <button
                onclick="askQuestion('Give me a C++ quiz')"
            >

                📝

                <div>

                    <b>
                        Practice
                    </b>

                    <small>
                        Give me a C++ quiz
                    </small>

                </div>

            </button>

        </div>

    `;

}


/* =========================
   CHAT
========================= */

function sendMessage() {

    const input =
        document.getElementById(
            "messageInput"
        );


    const message =
        input.value.trim();


    if (message === "") {

        return;

    }


    addMessage(
        "user",
        message
    );


    input.value = "";


    setTimeout(function() {

        const answer =
            getAIResponse(message);


        addMessage(
            "ai",
            answer
        );

    }, 700);

}


/* =========================
   SUGGESTION QUESTION
========================= */

function askQuestion(question) {

    document.getElementById(
        "messageInput"
    ).value = question;


    sendMessage();

}


/* =========================
   ADD CHAT MESSAGE
========================= */

function addMessage(type, text) {

    const chat =
        document.getElementById(
            "chatMessages"
        );


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "chat-message " + type;


    message.innerHTML = `

        <div class="bubble">

            ${text}

        </div>

    `;


    chat.appendChild(message);


    window.scrollTo(
        0,
        document.body.scrollHeight
    );

}


/* =========================
   SIMPLE AI RESPONSES
========================= */

function getAIResponse(message) {

    const text =
        message.toLowerCase();


    if (
        text.includes("pointer")
    ) {

        return `

            <b>C++ Pointer kya hota hai?</b>

            <br><br>

            Pointer ek variable hota hai
            jo kisi doosre variable ka
            <b>memory address</b> store karta hai.

            <br><br>

            Example:

            <br><br>

            <code>
            int x = 10;<br>
            int *p = &x;
            </code>

            <br><br>

            <b>&x</b> → x ka address

            <br>

            <b>p</b> → address store karta hai

            <br>

            <b>*p</b> → x ki value deta hai

        `;

    }


    if (
        text.includes("loop")
    ) {

        return `

            <b>C++ Loop</b>

            <br><br>

            Loop ka use same code ko
            baar-baar execute karne ke liye
            hota hai.

            <br><br>

            Common loops:

            <br>

            1. for loop

            <br>

            2. while loop

            <br>

            3. do-while loop

            <br><br>

            Example:

            <br><br>

            <code>

            for(int i = 1; i <= 5; i++) {
                cout << i;
            }

            </code>

        `;

    }


    if (
        text.includes("html") &&
        text.includes("css")
    ) {

        return `

            HTML website ka structure
            banata hai.

            <br><br>

            CSS website ko design karta hai.

            <br><br>

            Example:

            <br>

            HTML → Heading

            <br>

            CSS → Heading ka color,
            size aur position

            <br><br>

            HTML + CSS ke baad
            <b>JavaScript</b> learn karna
            useful next step hai.

        `;

    }


    if (
        text.includes("study plan")
    ) {

        return `

            <b>Simple Study Plan</b>

            <br><br>

            📚 1 hour → C++ / DSA

            <br>

            💻 1 hour → Web Development

            <br>

            🤖 30 minutes → AI/ML

            <br>

            🔁 30 minutes → Revision

            <br><br>

            Daily consistency sabse important hai.

        `;

    }


    if (
        text.includes("quiz")
    ) {

        return `

            Quiz ke liye left sidebar se

            <b>Quiz Generator</b>

            open karo.

            <br><br>

            Wahan subject aur topic
            select karke quiz generate
            kar sakte ho.

        `;

    }


    if (
        text.includes("career")
        ||
        text.includes("learn next")
    ) {

        return `

            Agar tum HTML aur CSS
            jaante ho, to next:

            <br><br>

            1. JavaScript

            <br>

            2. Git & GitHub

            <br>

            3. Responsive Web Design

            <br>

            4. React

            <br>

            5. Backend basics

            <br><br>

            Saath me C++ aur DSA
            practice karte raho.

        `;

    }


    return `

        Good question! 👍

        <br><br>

        Main tumhe is topic ko
        simple language me explain
        karne me help kar sakta hoon.

        <br><br>

        Tum question ko thoda
        specific karke pucho.

        <br><br>

        Example:

        <br>

        "Explain arrays in C++"

        <br>

        "What is JavaScript?"

        <br>

        "Give me DSA questions"

    `;

}


/* =========================
   QUIZ GENERATOR
========================= */

function generateQuiz() {

    const subject =
        document.getElementById(
            "quizSubject"
        ).value;


    const topic =
        document.getElementById(
            "quizTopic"
        ).value;


    const quizBox =
        document.getElementById(
            "quizBox"
        );


    quizBox.innerHTML = `

        <div class="output">

            <h2>
                ${subject} Quiz
            </h2>

            <p>
                Topic: ${topic || "Basics"}
            </p>


            <div class="question">

                <h3>
                    1. Which language is used
                    to style a webpage?
                </h3>

                <label class="option">

                    <input
                        type="radio"
                        name="q1"
                    >

                    HTML

                </label>


                <label class="option">

                    <input
                        type="radio"
                        name="q1"
                        value="correct"
                    >

                    CSS

                </label>


                <label class="option">

                    <input
                        type="radio"
                        name="q1"
                    >

                    C++

                </label>

            </div>


            <div class="question">

                <h3>
                    2. Which language adds
                    interactivity to webpages?
                </h3>

                <label class="option">

                    <input
                        type="radio"
                        name="q2"
                    >

                    HTML

                </label>


                <label class="option">

                    <input
                        type="radio"
                        name="q2"
                        value="correct"
                    >

                    JavaScript

                </label>


                <label class="option">

                    <input
                        type="radio"
                        name="q2"
                    >

                    CSS

                </label>

            </div>


            <button
                class="primary-btn"
                onclick="checkQuiz()"
            >
                Check Score
            </button>


            <p
                id="score"
                style="margin-top:15px"
            ></p>

        </div>

    `;

}


/* =========================
   CHECK QUIZ
========================= */

function checkQuiz() {

    let score = 0;


    const answers =
        document.querySelectorAll(
            'input[value="correct"]'
        );


    answers.forEach(function(answer) {

        if (answer.checked) {

            score++;

        }

    });


    document.getElementById(
        "score"
    ).innerHTML =

        "<b>Your Score: " +
        score +
        " / 2</b>";

}


/* =========================
   STUDY PLANNER
========================= */

function generatePlan() {

    const subjects =
        document.getElementById(
            "subjects"
        ).value;


    const hours =
        document.getElementById(
            "hours"
        ).value;


    const goal =
        document.getElementById(
            "goal"
        ).value;


    const box =
        document.getElementById(
            "planBox"
        );


    box.innerHTML = `

        <div class="output">

            <h2>
                📅 Your Study Plan
            </h2>

            <br>

            <b>Subjects:</b>
            ${subjects || "C++, DSA, Web Development"}

            <br><br>

            <b>Daily Time:</b>
            ${hours} hours

            <br><br>

            <b>Goal:</b>
            ${goal || "Improve skills"}

            <br><br>

            <b>Day 1</b>
            <br>
            Learn basic concepts

            <br><br>

            <b>Day 2</b>
            <br>
            Practice questions

            <br><br>

            <b>Day 3</b>
            <br>
            Continue new topics

            <br><br>

            <b>Day 4</b>
            <br>
            Practice + revision

            <br><br>

            <b>Day 5</b>
            <br>
            Solve problems

            <br><br>

            <b>Day 6</b>
            <br>
            Project practice

            <br><br>

            <b>Day 7</b>
            <br>
            Full revision + test

        </div>

    `;

}


/* =========================
   CAREER GUIDE
========================= */

function careerGuide() {

    const skills =
        document.getElementById(
            "skills"
        ).value;


    const interest =
        document.getElementById(
            "interest"
        ).value;


    const box =
        document.getElementById(
            "careerBox"
        );


    box.innerHTML = `

        <div class="output">

            <h2>
                🎯 Your Learning Roadmap
            </h2>

            <br>

            <b>Your Skills:</b>

            <br>

            ${skills || "HTML, CSS"}

            <br><br>

            <b>Your Interest:</b>

            <br>

            ${interest || "Software Development"}

            <br><br>

            <b>Recommended Next Steps:</b>

            <br><br>

            1️⃣ Learn JavaScript

            <br><br>

            2️⃣ Build 2-3 projects

            <br><br>

            3️⃣ Learn Git & GitHub

            <br><br>

            4️⃣ Start DSA

            <br><br>

            5️⃣ Learn React

            <br><br>

            6️⃣ Explore AI/ML if interested

        </div>

    `;

}