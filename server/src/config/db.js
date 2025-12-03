// db.js (MSSQL + Sequelize VERSION)
require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

// Extract instance (if any)
const [host, instanceName] = process.env.DB_HOST.split("\\");

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host,
    dialect: "mssql",
    port: Number(process.env.DB_PORT) || 1433,
    logging: false,
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: instanceName || undefined,
      },
    },
  }
);

// ----------------------------
// MODELS
// ----------------------------

// COMPANIES
const Company = sequelize.define("companies", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_name: { type: DataTypes.STRING, allowNull: false },
  company_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: "UQ_company_code",
  },
});

// const User = sequelize.define("users", {
//   id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//   first_name: DataTypes.STRING,
//   last_name: DataTypes.STRING,

//   user_code: { type: DataTypes.STRING },
//   username: { type: DataTypes.STRING, unique: "UQ_users_username" },
//   email: { type: DataTypes.STRING, unique: "UQ_users_email" },

//   password: { type: DataTypes.STRING, allowNull: false },
//   contact_no: DataTypes.STRING,
//   date_of_birth: DataTypes.DATEONLY,
//   department: DataTypes.STRING,
//   division: DataTypes.TEXT,
//   role: { type: DataTypes.STRING },

// selected_employees: {
//   type: DataTypes.TEXT,
//   allowNull: true,

//   get() {
//     const raw = this.getDataValue("selected_employees");

//     try {
//       const parsed = JSON.parse(raw);

//       // If object → OK
//       if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
//         return parsed;
//       }

//       // If array → convert to object
//       if (Array.isArray(parsed)) {
//         const obj = {};
//         parsed.forEach(id => obj[id] = true);
//         return obj;
//       }

//       return {};
//     } catch {
//       return {};
//     }
//   },

//   set(value) {
//     // If array → convert automatically
//     if (Array.isArray(value)) {
//       const obj = {};
//       value.forEach(id => obj[id] = true);
//       this.setDataValue("selected_employees", JSON.stringify(obj));
//       return;
//     }

//     // If not object → reject
//     if (typeof value !== "object") {
//       throw new Error("selected_employees must be an object or array");
//     }

//     // If object → save directly
//     this.setDataValue("selected_employees", JSON.stringify(value));
//   }
// }


// });




// PROJECTS


const User = sequelize.define("users", {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },

  first_name: DataTypes.STRING,
  last_name: DataTypes.STRING,

  user_code: { 
    type: DataTypes.STRING,
  },

  username: { 
    type: DataTypes.STRING, 
    unique: "UQ_users_username" 
  },

  email: { 
    type: DataTypes.STRING, 
    unique: "UQ_users_email",
    allowNull: false
  },

  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },

  contact_no: {
    type: DataTypes.STRING,
    // Validation equivalent for 10-digit number
    validate: {
      isNumeric: true,
      len: [10, 10]
    }
  },

  date_of_birth: DataTypes.DATEONLY,

  department: DataTypes.STRING,

  division: DataTypes.TEXT,

  role: { 
    type: DataTypes.STRING, 
    defaultValue: "user" 
  },

  // ⭐ Store array as JSON string in MSSQL
  selected_employees: { 
    type: DataTypes.TEXT,
    defaultValue: "[]",   
    get() {
      const raw = this.getDataValue("selected_employees");
      return raw ? JSON.parse(raw) : [];
    },
    set(value) {
      this.setDataValue("selected_employees", JSON.stringify(value));
    }
  },

  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
});


const Project = sequelize.define("projects", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  project_name: DataTypes.STRING,
  project_code: { type: DataTypes.STRING, unique: "UQ_projects_project_code" },
});

// TASKS
const Task = sequelize.define("tasks", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  project_title: DataTypes.TEXT,
  priority: DataTypes.INTEGER,
  status: { type: DataTypes.STRING, defaultValue: "pending" },
  timer_start: DataTypes.DATE,
  elapsed_seconds: { type: DataTypes.INTEGER, defaultValue: 0 },
  start: DataTypes.DATE,
  end_time: DataTypes.DATE,
  duration_minutes: DataTypes.INTEGER,
  reason: DataTypes.TEXT,
  task_start: { type: DataTypes.BOOLEAN, defaultValue: false },

  // ⬇ NEW COLUMNS FOR REASONS
  start_early_reason: DataTypes.TEXT,
  start_late_reason: DataTypes.TEXT,
  pause_reason: DataTypes.TEXT,
  stop_reason: DataTypes.TEXT,

  // ⬇ NEW COLUMNS YOU ASKED
  added_by_user: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  },

  approval_status: { 
    type: DataTypes.STRING, 
    defaultValue: "pending" 
  }
});


// TASK REASONS
const TaskReason = sequelize.define("task_reasons", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  reason_type: DataTypes.INTEGER,
  reason: DataTypes.TEXT,

  // ⬇ REQUIRED FIELDS (missing before)
  task_id: DataTypes.INTEGER,
  user_id: DataTypes.INTEGER,
  company_id: DataTypes.INTEGER,
});

// TIME UPDATE
const TimeUpdate = sequelize.define("time_update", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: DataTypes.INTEGER,

  // ⬇ FIX: "time" is RESERVED KEYWORD in MSSQL
  time_logged: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },

  // ⬇ REQUIRED FIELDS (missing before)
  task_id: DataTypes.INTEGER,
  user_id: DataTypes.INTEGER,
});

// SHIFTS
const Shift = sequelize.define("shifts", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  shift_name: DataTypes.STRING,
  shift_start: { type: DataTypes.STRING },
shift_end: { type: DataTypes.STRING },


  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});


// SHIFT BREAKS
const ShiftBreak = sequelize.define("shift_breaks", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  break_type: DataTypes.STRING,
break_start: { type: DataTypes.STRING },
break_end: { type: DataTypes.STRING },


  // ⬇ ADD THIS — REQUIRED
  shift_id: {       
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // ⬇ Optional: if every break belongs to a company
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});


// DECLARED HOLIDAYS
const DeclaredHoliday = sequelize.define("declared_holidays", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  holiday_date: DataTypes.DATEONLY,
  description: DataTypes.TEXT,
});

const AddedTaskByUser = sequelize.define("added_task_by_user", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  project_title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  task_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  start_task: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_task: {
    type: DataTypes.DATE,
    allowNull: false
  }
});


// ----------------------------
// RELATIONSHIPS (MSSQL SAFE)
// ----------------------------

Company.hasMany(User, { foreignKey: "company_id" });
User.belongsTo(Company, { foreignKey: "company_id" });

Company.hasMany(Project, { foreignKey: "company_id" });
Project.belongsTo(Company, { foreignKey: "company_id" });

Company.hasMany(Task, { foreignKey: "company_id" });
Task.belongsTo(Company, { foreignKey: "company_id" });

// Users assigning tasks
User.hasMany(Task, { foreignKey: "assigned_by" });
Task.belongsTo(User, { as: "AssignedBy", foreignKey: "assigned_by" });

// Users receiving tasks
User.hasMany(Task, { foreignKey: "assigned_to" });
Task.belongsTo(User, { as: "AssignedTo", foreignKey: "assigned_to" });

// Task reasons
Task.hasMany(TaskReason, { foreignKey: "task_id", onDelete: "NO ACTION" });
TaskReason.belongsTo(Task, { foreignKey: "task_id" });

User.hasMany(TaskReason, { foreignKey: "user_id", onDelete: "NO ACTION" });
TaskReason.belongsTo(User, { foreignKey: "user_id" });

// Time updates
Task.hasMany(TimeUpdate, { foreignKey: "task_id" });
TimeUpdate.belongsTo(Task, { foreignKey: "task_id" });

User.hasMany(TimeUpdate, { foreignKey: "user_id" });
TimeUpdate.belongsTo(User, { foreignKey: "user_id" });

// Shifts
Company.hasMany(Shift, { foreignKey: "company_id" });
Shift.belongsTo(Company, { foreignKey: "company_id" });

Shift.hasMany(ShiftBreak, { foreignKey: "shift_id" });
ShiftBreak.belongsTo(Shift, { foreignKey: "shift_id" });

Company.hasMany(DeclaredHoliday, { foreignKey: "company_id" });
DeclaredHoliday.belongsTo(Company, { foreignKey: "company_id" });

User.hasMany(AddedTaskByUser, { foreignKey: "user_id" });
AddedTaskByUser.belongsTo(User, { foreignKey: "user_id" });

Company.hasMany(AddedTaskByUser, { foreignKey: "company_id" });
AddedTaskByUser.belongsTo(Company, { foreignKey: "company_id" });


// ----------------------------
// EXPORT + SYNC
// ----------------------------

async function initializeTables() {
  try {
    await sequelize.sync();
    console.log("✅ All Sequelize MSSQL tables synced successfully.");
  } catch (err) {
    console.error("❌ Sequelize Sync Error:", err);
  }
}

module.exports = {
  sequelize,
  initializeTables,
  User,
  Company,
  Project,
  Task,
  TimeUpdate,
  TaskReason,
  Shift,
  ShiftBreak,
  DeclaredHoliday,
  AddedTaskByUser,
};
