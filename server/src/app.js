const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const authenticateJWT = require('./middlewares/auth');
const cors = require("cors");
const authRoutes = require('./modules/auth/auth.routes');
const holidayMasterRoutes = require('./modules/holiday-master/holidayMaster.routes');
const projectMasterRoutes = require('./modules/project-master/projectMaster.routes');
const shiftMasterRoutes = require('./modules/shift-break/shiftBreak.routes');
const shiftRoutes = require('./modules/shifts/shift.routes');
const taskReasonsRoutes = require('./modules/task-reason/taskReason.routes');
const startStopTimeUpdateRoutes = require('./modules/start-stop-time-update/StartStopTimeUpdate.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');
const userRoutes = require('./modules/users/users.routes');
const companyDetails = require('./modules/company-details/companyDetails.routes');


const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectMasterRoutes);
app.use('/api/shift-breaks', shiftMasterRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/taskReasons', taskReasonsRoutes);
app.use('/api/declare-holiday', holidayMasterRoutes);
app.use('/api/time_update', startStopTimeUpdateRoutes);
app.use('/api/tasks', tasksRoutes)
app.use('/api/users', userRoutes);
app.use('/api/companyDetails', companyDetails);

// Example of protected route
// const { authenticateJWT} = require('./middlewares/auth');
// app.get('/api/protected', authenticateJWT, (req, res) => {
//   res.json({ message: `Hello ${req.user.role}!` });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
app.get('/api/protected', authenticateJWT, (req, res) => {
    res.json({ message: `Hello ${req.user.role}!` });
});


module.exports = app;