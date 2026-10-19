const express = require("express");
const cors = require("cors");

const { authUser } = require("./utils/auth");

const authRoutes = require("./routes/common");
const userRoutes = require("./routes/user");
const workerRouter = require("./routes/worker");
const feedbackRouter = require("./routes/feedback")
const adminRouter = require("./routes/admin");
const app = express();
const PORT = 3000;
//middleware

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//public routes
app.use("/auth", authRoutes);

//  JWT Middleware
app.use(authUser);

//Protected Routes
app.use("/user", userRoutes);
app.use("/worker", workerRouter);
app.use("/feedback",feedbackRouter);
app.use("/admin", adminRouter);

//Home Route
app.get("/", (req, res) => {
    res.send("SmartServe Backend Running");
});

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});