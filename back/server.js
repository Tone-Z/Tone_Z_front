const express = require("express");
const cors = require("cors");

const loginRouter = require("./routes/login");
const signupRouter = require("./routes/signup");
const photocardRouter = require("./routes/photocard");
const diagnosisRouter = require("./routes/diagnosis");
const chatbotRouter = require("./routes/chatbot");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.use("/login", loginRouter);
app.use("/signup", signupRouter);
app.use("/photocard", photocardRouter);
app.use("/diagnosis", diagnosisRouter);
app.use("/chatbot", chatbotRouter);

app.listen(8080, function () {
    console.log("서버 실행 중: http://localhost:8080");
});