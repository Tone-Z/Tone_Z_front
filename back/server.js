const express = require("express");
const cors = require("cors");

const loginRouter = require("./routes/login");
const signupRouter = require("./routes/signup");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/login", loginRouter);
app.use("/signup", signupRouter);

app.listen(8080, function () {
    console.log("서버 실행 중: http://localhost:8080");
});