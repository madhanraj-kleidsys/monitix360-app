import { useState, useEffect, useRef } from "react";
import { Card, Button, Dialog, DialogTitle, DialogContent, TextField, Box, Select, FormControl, InputLabel, Snackbar, Alert } from "@mui/material";
import '../../App.css'
import { Menu, MenuItem } from "@mui/material";
import "tippy.js/dist/tippy.css";
import { DialogContentText, DialogActions } from '@mui/material';
import TaskDetails from "../task-details/TaskDetails";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import TimelineCalendar from "../timeline-calender/TimelineCalendar";
import moment from 'moment';
import Navbar from "../Navbar";
import StatusLegendIndicator from "../utils/StatusLegendIndicator";
import { exportToExcel, exportToPDF } from "../utils/ExportExcelPdf";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { UserMap } from "../utils/UserMap";
import { CircularProgress } from '@mui/material';
import { ErrorSnackbar, InfoSnackbar, SuccessSnackbar } from "../Commons/commonVariables";
import { useSnackbar } from 'notistack';
import ApiService from "../../service/ApiService";
import DeleteModal from "../Commons/commonItems/DeleteModal";
import TaskForm from "./AddEditTaskForm/TaskForm";
import ApprovalTasksComponent from "./ApprovalTasks";
import { subscribePending } from "../events/PendingEvents";
import { socket } from "../../socket";

export default function AdminDashBoard() {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [open, setOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        Project_Title: "",
        assigned_to: "",
        status: "pending",
        startTime: "",
        endTime: "",
        priority: "",
        reason: "",
        duration_minutes: "",
    });

    const [startTimeTouched, setStartTimeTouched] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    // const [loading, setLoading] = useState(false);
    const [filterPriority, setFilterPriority] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [selectedTitle, setSelectedTitle] = useState("");
    const [deletedTask, setDeletedTask] = useState(null);
    const [undoTimeoutId, setUndoTimeoutId] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [taskEvents, setTaskEvents] = useState([]);
    const [unplanned, setUnplanned] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [zoomIndex, setZoomIndex] = useState(0);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
    const [showArrow, setShowArrow] = useState(false);
    // Inside AdminDashboard.js
    const [tabValue, setTabValue] = useState(0);
    const unassignRef = useRef();
    const [breaks, setBreaks] = useState([]);

    const { enqueueSnackbar } = useSnackbar();

    const [showApprovalTasks, setShowApprovalTasks] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [timelineVersion, setTimelineVersion] = useState(0);



    // const fetchPending = async () => {
    //     try {
    //         const res = await ApiService.getPendingUserRequests();
    //         setPending(res.data);

    //         if (res.data.length > 0) {
    //             setSelectedTask(res.data[0]);
    //         }
    //     } catch (err) {
    //         console.error("Error loading pending tasks:", err);
    //     }
    // };

    // useEffect(() => {
    //     fetchPending();

    //     const timer = setInterval(fetchPending, 10000);
    //     return () => clearInterval(timer);
    // }, []);



    // const updateApproval = async (status) => {
    //     try {
    //         console.log("aproved")
    //         await ApiService.updateAdminApproval(selectedTask.id, status);

    //         alert(`Task ${status}`);
    //         fetchPending();
    //         setSelectedTask(null);
    //     } catch (err) {
    //         console.error("Error updating approval:", err);
    //     }
    // };
useEffect(() => {
    const fetchPendingCount = async () => {
        try {
            const res = await ApiService.getPendingUserRequests();
            setPendingCount(res.data.length);
        } catch (err) {
            console.error("Error fetching pending count:", err);
        }
    };

    // Initial load
    fetchPendingCount();

    // Listen for future changes
    const unsubscribe = subscribePending(() => {
        fetchPendingCount();
    });

    return unsubscribe;
}, []);

    useEffect(() => {
        const fetchBreaks = async () => {
            try {
                const res = await ApiService.getShiftBreaks();
                setBreaks(res.data || []);
            } catch (err) {
                console.error("Error fetching breaks", err);
            }
        };
        fetchBreaks();
    }, []);


    useEffect(() => {
        const handleMouseMove = (e) => {
            const threshold = 80;
            const nearRightEdge = window.innerWidth - e.clientX < threshold;
            setShowArrow(nearRightEdge);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);


    // 26-11-2025 - Changes by Priyanka
    // fetchUserTaskRequests useEffect
    // useEffect(() => {
    //     const interval = setInterval(fetchUserTaskRequests, 5000);
    //     return () => clearInterval(interval);
    // }, []);

    // const fetchUserTaskRequests = async () => {
    //     try {
    //         const res = await ApiService.getPendingUserRequests();
    //         if (res.data.length > 0) {
    //             setPendingRequests(res.data);
    //             setSelectedRequest(res.data[0]);
    //             setShowApprovalPopup(true);
    //         }
    //     } catch (err) {
    //         console.error("Error fetching requests", err);
    //     }
    // };

    const ZOOM_LEVELS = [
        { label: 'day', zoom: 24 * 60 * 60 * 1000 },
        { label: 'week', zoom: 7 * 24 * 60 * 60 * 1000 },
        { label: 'month', zoom: 30 * 24 * 60 * 60 * 1000 },
        { label: 'year', zoom: 365 * 24 * 60 * 60 * 1000, stepAmount: 1, stepUnit: 'year' }, // add year too
    ];


    const zoomDurations = {
        minute: 2 * 60 * 60 * 1000,
        hour: 12 * 60 * 60 * 1000,
        day: 3 * 24 * 60 * 60 * 1000,
        week: 14 * 24 * 60 * 60 * 1000,
        month: 60 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
    };

    const updateZoom = (start, zoom) => {
        setVisibleTimeStart(start.valueOf());
        setVisibleTimeEnd(start.clone().add(zoom).valueOf());
    };

    const getTodayTimeRange = () => {
        const start = moment().startOf('day').add(9, 'hours');
        const end = moment().startOf('day').add(18, 'hours');
        return [start.valueOf(), end.valueOf()];
    };

    const [visibleTimeStart, setVisibleTimeStart] = useState(getTodayTimeRange()[0]);
    const [visibleTimeEnd, setVisibleTimeEnd] = useState(getTodayTimeRange()[1]);

    const zoomIn = () => {
        const zoomRange = visibleTimeEnd - visibleTimeStart;
        const newZoom = Math.max(zoomDurations.minute, zoomRange * 0.7);
        const center = moment(visibleTimeStart + zoomRange / 2);
        const newStart = center.clone().subtract(newZoom / 2);
        const newEnd = center.clone().add(newZoom / 2);

        updateZoom(newStart, newZoom);
        const hours = newZoom / (60 * 60 * 1000);
        const newCanvasWidth = Math.max(window.innerWidth, hours * 150);

        setCanvasWidth(newCanvasWidth);

    };


    const zoomOut = () => {
        const zoomRange = visibleTimeEnd - visibleTimeStart;
        const newZoom = Math.min(zoomDurations.year, zoomRange * 1.3);
        const center = moment(visibleTimeStart + zoomRange / 2);
        const newStart = center.clone().subtract(newZoom / 2);
        const newEnd = center.clone().add(newZoom / 2);

        updateZoom(newStart, newZoom);

        const hours = newZoom / (60 * 60 * 1000);
        const newCanvasWidth = Math.max(window.innerWidth, hours * 150);
        setCanvasWidth(newCanvasWidth);
    };

const goToday = () => {
    // If NOT in day view → switch to day view first
    if (zoomIndex !== 0) {
        setZoomIndex(0);  // 0 = day mode
        return;           // useEffect will handle positioning
    }

    // If already in day view → just go to today 9 AM – 6 PM
    const start = moment().startOf("day").hour(9);
    const end = moment().startOf("day").hour(18);

    setVisibleTimeStart(start.valueOf());
    setVisibleTimeEnd(end.valueOf());
};


    const goPrev = () => {
        const zoom = ZOOM_LEVELS[zoomIndex];
        const stepAmount = zoom.stepAmount || 1;
        const stepUnit = zoom.stepUnit || 'day';

        const newStart = moment(visibleTimeStart).subtract(stepAmount, stepUnit);
        const newEnd = moment(visibleTimeEnd).subtract(stepAmount, stepUnit);

        setVisibleTimeStart(newStart.valueOf());
        setVisibleTimeEnd(newEnd.valueOf());
    };

    const goNext = () => {
        const zoom = ZOOM_LEVELS[zoomIndex];
        const stepAmount = zoom.stepAmount || 1;
        const stepUnit = zoom.stepUnit || 'day';

        const newStart = moment(visibleTimeStart).add(stepAmount, stepUnit);
        const newEnd = moment(visibleTimeEnd).add(stepAmount, stepUnit);

        setVisibleTimeStart(newStart.valueOf());
        setVisibleTimeEnd(newEnd.valueOf());
    };



    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await ApiService.getProjects();
                setProjects(response.data);
            } catch (err) {
                console.error("Failed to load projects", err);
            }
        };

        fetchProjects();
    }, []);

    const userMap = UserMap();

    const handleExport = (type, start, end) => {

        // console.log(type)
        const selectedDate = new Date(start);
        selectedDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);

        const filtered = taskEvents.filter(task => {
            const taskStart = new Date(task.start || task.original_start);
            const taskEnd = new Date(task.end_time || task.original_end_time);

            return taskStart >= selectedDate && taskEnd <= endOfDay;
        });

        if (type === 'excel') {
            exportToExcel(filtered, userMap);
        } else {
            exportToPDF(filtered, userMap);
        }
    };

    useEffect(() => {
        const fetchUnplanned = async () => {
            const res = await ApiService.getUnplannedTasks();
            setUnplanned(res.data);
        };
        fetchUnplanned();
    }, []);

    const filteredDescriptions = unplanned
        ?.map(task => task.description)
        .filter((desc, index, self) => desc && self.indexOf(desc) === index);

    useEffect(() => {
        ApiService.getHolidays()
            .then(res => {
                const holidayList = res.data.map(h => ({
                    ...h,
                    holiday_date: moment(h.holiday_date).format('YYYY-MM-DD'), // convert date to ISO string
                }));
                setHolidays(holidayList);
            })
            .catch(err => console.error('Error fetching holidays:', err));
    }, []);

    const isSecondOrFourthSaturday = (date) => {
        const jsDate = new Date(date);
        const day = jsDate.getDay();
        if (day !== 6) return false;

        const dateNum = jsDate.getDate();
        const weekOfMonth = Math.ceil(dateNum / 7);
        return weekOfMonth === 2 || weekOfMonth === 4;
    };



    const calendarRef = useRef(null);



    const priorityMap = {
        1: "High",
        2: "Medium",
        3: "Low"
    };


    // Fetch users from the server
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getAllUsers();

            // Filter users with the role of 'user'
            const userList = response.data.filter((user) => user.role === 'user');
            setUsers(userList); // Update the state with the filtered users
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false); // Set loading to false once data is fetched
        }
    };


    // Fetch users when the component mounts
    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (!newEvent?.assigned_to || users.length === 0) return;

        const user = users.find((u) => u.id === newEvent.assigned_to);
        if (user) {
            setSelectedUserId(user.id);
            setSelectedUser(user);
        } else {
            console.warn("Assigned user not found in user list");
        }
    }, [newEvent, users]);



    const getUsernameById = (id) => {
        const user = users.find((u) => u.id === id);
        return user ? `${user.username}` : "";
    };

    const validationSchema = Yup.object().shape({
        title: Yup.string().required("Title is required"),
        description: Yup.string().required("Description is required"),
        Project_Title: Yup.string().required("Project title is required"), // ✅ Added
        priority: Yup.number().required("Priority is required"),
        assigned_to: Yup.string().required("Assignee is required"),
        startTime: Yup.string().required("Start Time is required"),
        endTime: Yup.string().required("End Time is required"),
        duration_minutes: Yup.number()
            .typeError("Duration must be a number")
            .positive("Duration must be greater than 0")
            .required("Duration is required"), // ✅ Added
        status: Yup.string()
            .oneOf(["pending", "In Progress", "completed", "Incomplete"], "Invalid status")
            .required("Status is required"),
    });

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const response = await ApiService.getAllTasks();

                if (response.status === 200) {
                    const reversePriorityMap = {
                        high: 1,
                        medium: 2,
                        low: 3
                    };


                    const updatedEvents = response.data.map(event => {


                        // Normalize priority
                        let numericPriority = 2; // Default: Medium
                        if (typeof event.priority === "string") {
                            numericPriority = reversePriorityMap[event.priority.toLowerCase()] ?? 2;
                        } else if (typeof event.priority === "number") {
                            numericPriority = event.priority;
                        }

                        return {
                            id: event.id,
                            title: event.title || "",
                            description: event.description || "",
                            priority: numericPriority,
                            assigned_to: event.assigned_to || "",
                            assigned_by: event.assigned_by || "",
                            start: new Date(event.start),
                            end_time: new Date(event.end_time || event.start),
                            status: event.status || "pending",
                            reason: event.reason || "",
                            Project_Title: event.project_title || "",
                            duration_minutes: event.duration_minutes || 0,
                            allDay: false
                        };
                    });
                    // console.log("up",updatedEvents)

                    setEvents(updatedEvents);
                }
            } catch (error) {
                console.error("❌ Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);


    const handleRightClick = (e, event) => {
        e.preventDefault(); // Prevent default browser context menu
        // console.log("Event", event)
        setContextMenu({
            mouseX: e.clientX - 2, // Adjusting for precise position
            mouseY: e.clientY - 4,
            event, // Store the event for later use
        });
    };

    // Function to handle editing the event
    const handleEditEvent = (event) => {
        if (!event) return;

        // console.log("📝 Description from event:", event);

        const reversePriorityMap = {
            high: 1,
            medium: 2,
            low: 3,
        };

        const fixTimeFormat = (timeStr) => {
            if (!timeStr) return "";
            const date = new Date(timeStr);
            date.setHours(date.getHours() + 5);
            date.setMinutes(date.getMinutes() + 30);
            return date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
        };

        // ✅ Use correct original/planned start and end
        const originalStart = event.plannedStart || event.original_start || event.extendedProps?.start || event.start;
        const originalEnd = event.plannedEnd || event.original_end_time || event.extendedProps?.end_time || event.end;

        const start = new Date(originalStart);
        const end = new Date(originalEnd);

        const priorityVal = event.extendedProps?.priority || event.priority;

        let numericPriority;
        if (typeof priorityVal === "string") {
            numericPriority = reversePriorityMap[priorityVal.toLowerCase()] ?? 2;
        } else {
            numericPriority = priorityVal;
        }

        const description = (event.extendedProps?.description || event.description || "").trim();
        const durationMin = event.extendedProps?.duration_minutes || event.duration_minutes || 0;
        const hours = Math.floor(durationMin / 60);
        const minutes = durationMin % 60;
        const formattedDuration = `${hours}${minutes > 0 ? ':' + String(minutes).padStart(2, '0') : ''}`;

        const updatedEvent = {
            id: event.id,
            title: event.title || "",
            description,
            assigned_to: event.extendedProps?.assigned_to || event.assigned_to || "",
            start,
            end,
            startTime: fixTimeFormat(start),
            endTime: fixTimeFormat(end),
            resourceId: event.extendedProps?.assigned_to || event.assigned_to || "",
            status: event.extendedProps?.status || event.status || "pending",
            priority: numericPriority,
            reason: event.extendedProps?.reason || event.reason || "",
            Project_Title: event.project_title || event.extendedProps?.Project_Title || "",
            duration_minutes: durationMin,
            formattedDuration,
        };

        // console.log("📝 Updated Event for Modal:", updatedEvent);
        // 
        setSelectedTitle(event.title);

        setEvents((prevEvents) =>
            prevEvents.map((existingEvent) =>
                existingEvent.id === updatedEvent.id ? updatedEvent : existingEvent
            )
        );

        setNewEvent(updatedEvent);
        setOpen(true);
    };
    // console.log("seletedtitle: ", selectedTitle)
    //     console.log("events: ", events)

    const handleDeleteTask = (taskId) => {
        const originalId = String(taskId).split('-')[0]; // Extract base ID
        // console.log("🧹 Deleting Task ID:", originalId);

        const calendarApi = calendarRef.current?.getApi();
        const calendarEvent = calendarApi?.getEventById(String(taskId));

        const deleted = events.find((task) => String(task.id) === originalId);
        if (!deleted) return;

        // ✅ Remove from UI
        if (calendarEvent) calendarEvent.remove();

        // ✅ Remove from raw events
        setEvents((prev) =>
            prev.filter((task) => String(task.id).split('-')[0] !== originalId)
        );

        // ✅ Remove from taskEvents as well
        setTaskEvents((prev) =>
            prev.filter((task) => String(task.id).split('-')[0] !== originalId)
        );

        setDeletedTask(deleted);

        const timeoutId = setTimeout(async () => {
            try {
                await ApiService.deleteTask(originalId);
                setDeletedTask(null);
                enqueueSnackbar("Task deleted permanently", SuccessSnackbar);
            } catch (error) {
                console.error("❌ Error deleting task:", error);
                // alert("Failed to delete the task permanently.");
                enqueueSnackbar("Failed to delete the task permanently", ErrorSnackbar);
            }
        }, 3000);

        setUndoTimeoutId(timeoutId);
    };



    // console.log("users: ", users)

    const handleUndoDelete = () => {
        if (!deletedTask) return;

        // Restore to local state
        setEvents((prev) => [...prev, deletedTask]);

        // Add back to calendar UI
        const calendarApi = calendarRef.current?.getApi();
        calendarApi?.addEvent(deletedTask);

        // Cancel backend deletion
        clearTimeout(undoTimeoutId);
        setDeletedTask(null);
    };


    const [showChart, setShowChart] = useState(false);

    const handleClose = () => {
        setNewEvent({
            title: "",
            description: "",
            priority: 2,
            status: "pending",
            startTime: "",
            endTime: "",
            assigned_to: "",
            Project_Title: "",
            duration_minutes: "",
            reason: "",
        });
        setOpen(false);
    };

    // console.log("event: ", eventToDelete)
    const allocateWorkingHours = (
        startTime,
        durationMinutes,
        breaks = [],
        holidays = [],
        lastTaskEndTime = null,
        isEditing = false
    ) => {


        const slots = [];
        let remaining = durationMinutes;
        const WORK_START_HOUR = 9;
        const WORK_END_HOUR = 18;

        let current = new Date(startTime);
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        // ✅ Use lastTaskEndTime ONLY if we're NOT editing
        if (!isEditing && lastTaskEndTime) {
            const lastEnd = new Date(lastTaskEndTime);
            const lastEndDay = new Date(lastEnd);
            lastEndDay.setHours(0, 0, 0, 0);

            if (lastEndDay >= todayStart) {
                current = new Date(Math.max(current.getTime(), lastEnd.getTime()));
            } else {
                const todayWorkStart = new Date();
                todayWorkStart.setHours(9, 0, 0, 0);
                current = new Date(Math.max(current.getTime(), todayWorkStart.getTime()));
            }
        }



        const isHoliday = (dateStr) =>
            holidays.some((h) => h.holiday_date === dateStr);

        const isSecondOrFourthSaturday = (date) => {
            const day = date.getDay();
            const dateNum = date.getDate();
            const week = Math.ceil(dateNum / 7);
            return day === 6 && (week === 2 || week === 4);
        };

        const isInBreak = (time, dayBreaks) => {
            return dayBreaks.some((b) => {
                const [bsH, bsM] = b.break_start.split(":").map(Number);
                const [beH, beM] = b.break_end.split(":").map(Number);
                const breakStart = new Date(time);
                breakStart.setHours(bsH, bsM, 0, 0);
                const breakEnd = new Date(time);
                breakEnd.setHours(beH, beM, 0, 0);
                return time >= breakStart && time < breakEnd;
            });
        };

        const getNextBreakEnd = (time, dayBreaks) => {
            for (const b of dayBreaks) {
                const [bsH, bsM] = b.break_start.split(":").map(Number);
                const [beH, beM] = b.break_end.split(":").map(Number);
                const breakStart = new Date(time);
                breakStart.setHours(bsH, bsM, 0, 0);
                const breakEnd = new Date(time);
                breakEnd.setHours(beH, beM, 0, 0);
                if (time >= breakStart && time < breakEnd) return breakEnd;
            }
            return null;
        };

        while (remaining > 0) {
            const currentDateStr = current.toISOString().split("T")[0];
            const currentDay = current.getDay();

            if (
                currentDay === 0 ||
                isHoliday(currentDateStr) ||
                isSecondOrFourthSaturday(current)
            ) {
                current.setDate(current.getDate() + 1);
                current.setHours(WORK_START_HOUR, 0, 0, 0);
                continue;
            }

            const workStart = new Date(current);
            workStart.setHours(WORK_START_HOUR, 0, 0, 0);
            const workEnd = new Date(current);
            workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

            if (current >= workEnd) {
                current.setDate(current.getDate() + 1);
                current.setHours(WORK_START_HOUR, 0, 0, 0);
                continue;
            }

            if (current < workStart) current = new Date(workStart);

            // 🛑 Ensure start doesn't fall inside a break
            const dayBreaks = breaks.map((b) => ({ ...b }));
            for (const b of dayBreaks) {
                const [bsH, bsM] = b.break_start.split(":").map(Number);
                const [beH, beM] = b.break_end.split(":").map(Number);

                const breakStart = new Date(current);
                breakStart.setHours(bsH, bsM, 0, 0);
                const breakEnd = new Date(current);
                breakEnd.setHours(beH, beM, 0, 0);

                // If current is at or within break → skip to break end
                if (current >= breakStart && current < breakEnd) {
                    current = new Date(breakEnd);
                    break; // Only one break can match at a time
                }
            }

            const tempSlotStart = new Date(current);
            let tempSlotEnd = new Date(current);
            let minutesUsed = 0;

            while (minutesUsed < remaining && tempSlotEnd < workEnd) {
                if (isInBreak(tempSlotEnd, dayBreaks)) {
                    const breakEnd = getNextBreakEnd(tempSlotEnd, dayBreaks);
                    tempSlotEnd = breakEnd;
                    current = new Date(tempSlotEnd);
                    continue;
                }

                tempSlotEnd = new Date(tempSlotEnd.getTime() + 60000); // +1 minute
                minutesUsed++;
            }

            if (tempSlotEnd > tempSlotStart) {
                slots.push({
                    start: new Date(tempSlotStart),
                    end: new Date(tempSlotEnd),
                });
                current = new Date(tempSlotEnd);
                remaining -= minutesUsed;
            } else {
                // No usable time → move to next working day
                current.setDate(current.getDate() + 1);
                current.setHours(WORK_START_HOUR, 0, 0, 0);
            }
        }

        return slots;
    };

// console.log(breaks)

    const calculateDurationFromTimes = (startStr, endStr, breaksData = []) => {
        const start = new Date(startStr);
        const end = new Date(endStr);

        const WORK_START_HOUR = 9;
        const WORK_END_HOUR = 18;
        let totalMinutes = 0;

        let current = new Date(start);
        while (current < end) {
            const day = current.getDay();
            if (day !== 0) { // Skip Sunday
                const workDayStart = new Date(current);
                workDayStart.setHours(WORK_START_HOUR, 0, 0, 0);

                const workDayEnd = new Date(current);
                workDayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

                const sliceStart = current > workDayStart ? current : workDayStart;
                const sliceEnd = end < workDayEnd ? end : workDayEnd;

                if (sliceEnd > sliceStart) {
                    totalMinutes += Math.floor((sliceEnd - sliceStart) / 60000);
                }
            }

            // Move to next day
            current.setDate(current.getDate() + 1);
            current.setHours(0, 0, 0, 0);
        }

        // 🔹 Subtract breaks
        if (Array.isArray(breaksData) && breaksData.length > 0) {
            breaksData.forEach(shift => {
                if (Array.isArray(shift.shift_breaks)) {
                    shift.shift_breaks.forEach(b => {
                        // Build full datetime for this break on the same day
                        const breakStart = new Date(startStr.split("T")[0] + "T" + b.break_start);
                        const breakEnd = new Date(startStr.split("T")[0] + "T" + b.break_end);

                        if (breakStart < end && breakEnd > start) {
                            const overlapStart = breakStart > start ? breakStart : start;
                            const overlapEnd = breakEnd < end ? breakEnd : end;
                            if (overlapEnd > overlapStart) {
                                totalMinutes -= Math.floor((overlapEnd - overlapStart) / 60000);
                            }
                        }
                    });
                }
            });
        }

        return totalMinutes < 0 ? 0 : totalMinutes;
    };




    const fetchTasks = async () => {
        const { data } = await ApiService.getAllTasks();
        setTaskEvents(data);
    };

    // 🎯 Listen for real-time task updates from user dashboard
    useEffect(() => {
        if (!socket) return;

        // Ensure socket is connected
        if (!socket.connected) {
            socket.connect();
        }

        // Listen for taskUpdated events (when user starts/pauses/stops timer)
        const handleTaskUpdated = (data) => {
            // console.log("📡 Task updated via socket:", data);

            const incomingId = String(data.taskId);

            // Update taskEvents
            setTaskEvents((prevTasks) =>
                prevTasks.map((task) =>
                    String(task.id) === incomingId
                        ? {
                            ...task,
                            task_start: data.task_start,
                            timer_start: data.timer_start || null,
                            elapsed_seconds:
                                data.elapsed_seconds !== undefined
                                    ? data.elapsed_seconds
                                    : task.elapsed_seconds,
                        }
                        : task
                )
            );

            // Update events
            setEvents((prevEvents) =>
                prevEvents.map((event) =>
                    String(event.id) === incomingId
                        ? {
                            ...event,
                            task_start: data.task_start,
                            timer_start: data.timer_start || null,
                            elapsed_seconds:
                                data.elapsed_seconds !== undefined
                                    ? data.elapsed_seconds
                                    : event.elapsed_seconds,
                        }
                        : event
                )
            );

            // 🔥 CRITICAL — FORCE TIMELINE RENDER
            setTimelineVersion((prev) => prev + 1);
        };


        socket.on("taskUpdated", handleTaskUpdated);

        // Cleanup listener on unmount
        return () => {
            socket.off("taskUpdated", handleTaskUpdated);
        };
    }, []);

    useEffect(() => {

    if (!socket.connected) socket.connect();

    // Admin joins admin room
    socket.emit("joinAdmin");

    const handleNewTask = ({ task, message }) => {
        // console.log("📩 NEW TASK from user:", task);

        enqueueSnackbar(message, InfoSnackbar);

        setTaskEvents(prev => [task, ...prev]);
        setEvents(prev => [task, ...prev]);

        setPendingCount(prev => prev + 1);

        // force timeline rerender
        setTimelineVersion(prev => prev + 1);
    };

    socket.on("newUserTaskRequest", handleNewTask);

    return () => {
        socket.off("newUserTaskRequest", handleNewTask);
    };

    }, []);



    const handleUnassignTask = async (task) => {
        const projectName = task.project_title || task.Project_Title;

        const payload = {
            project_title: projectName,
            description: task.description,
            duration_minutes: task.duration_minutes || 60,
        };

        await ApiService.createUnplannedTask(payload);

        const realId = task.id.includes("-") ? task.id.split("-")[0] : task.id;
        await ApiService.deleteTask(realId);

        // Remove from planned state immediately
        setEvents((prev) => prev.filter((t) => String(t.id).split("-")[0] !== String(realId)));
        setTaskEvents((prev) => prev.filter((t) => String(t.id).split("-")[0] !== String(realId)));

        toast.success("✅ Task moved to unplanned");

        // 👉 Open TaskDetails on Unplanned tab
        setShowChart(true);
        setTabValue(1);

        // 👉 Also set the project tab (find its index)
        const projectIndex = projects.findIndex(
            (p) => p.project_name === projectName || p === projectName
        );
        // console.log("Project Index:", projectIndex);
        if (projectIndex >= 0) {
            // delay slightly so TaskDetails mounts first
            setTimeout(() => setTabIndex(projectIndex), 100);
        }
    };


    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    // 26-11-2025 - Priyanka
    // const handleUserTaskApproval = async (action) => {
    //     try {
    //         await ApiService.updateUserTaskApproval(selectedRequest.id, action);

    //         enqueueSnackbar(
    //             action === "approved"
    //                 ? "Task approved!"
    //                 : "Task rejected!",
    //             SuccessSnackbar
    //         );

    //         setShowApprovalPopup(false);
    //         fetchUserTaskRequests();
    //     } catch (err) {
    //         enqueueSnackbar("Failed to update request", ErrorSnackbar);
    //     }
    // };

    return (

        <Box sx={{ display: "flex", height: "60vh", background: darkMode ? " #151a2c" : " #F5F5F5", color: darkMode ? "#FFF" : "#000" }}>
            <ToastContainer position="top-center" autoClose={3000} />
            {/* Main Content */}

            <Box sx={{ flexGrow: 2, height: '65vh' }}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={2}
                    mb={2}
                    sx={{ width: '100vw' }}
                >
                    <Navbar
                        setSelectedUser={setSelectedUser}
                        selectedUser={selectedUser}
                        taskEvents={taskEvents}
                        setTaskEvents={setTaskEvents}
                        startDate={startDate}
                        endDate={endDate}
                        showChart={showChart}
                        setShowChart={setShowChart}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        handleExport={handleExport}
                        goPrev={goPrev}
                        goNext={goNext}
                        goToday={goToday}
                        zoomIn={zoomIn}
                        zoomOut={zoomOut}
                         pendingCount={pendingCount}
                        showApprovalTasks={showApprovalTasks}
                        setShowApprovalTasks={setShowApprovalTasks}
                        onTaskImport={fetchTasks}
                        actionButtons={
                            <Box display="flex" alignItems="center" gap={2} flexShrink={0}>
                                <Button
                                    sx={{
                                        background: darkMode
                                            ? "linear-gradient(120deg, #2feaa8, #028cf3)"
                                            : "#fff",
                                        borderRadius: "5px",
                                        border: '1px solid #ccc',
                                        textTransform: "none",
                                        color: '#727272ff',
                                        width: '60px',
                                        height: '30px',
                                        fontSize: '11px',
                                        fontFamily: 'inherit',
                                        whiteSpace: 'nowrap',
                                        '&:hover': {
                                            backgroundColor: ' #0D5EA6',
                                            color: 'white'
                                        },
                                    }}
                                    onClick={() => {
                                        setNewEvent({
                                            title: "",
                                            description: "",
                                            Project_Title: "",
                                            priority: "",
                                            assigned_to: "",
                                            startTime: "",
                                            endTime: "",
                                            duration_minutes: "",
                                            duration_display: "",
                                            status: "pending"
                                        });
                                        setOpen(true);
                                    }}
                                >
                                    Assign Task
                                </Button>
                            </Box>
                        }
                    />

                </Box>

                <Card
                    sx={{
                        p: 3,
                        background: darkMode ? " #282f49" : "rgb(255, 255, 255)",
                        height: "auto",
                        overflowY: 'auto',
                        width: '95vw',
                        marginLeft: '15px',
                        // backgroundColor: "green"
                    }}
                >
                    {showApprovalTasks ? (
                        <ApprovalTasksComponent onBack={() => setShowApprovalTasks(false)} />
                    ) : showChart ? (
                        <TaskDetails
                            selectedUser={selectedUser}
                            events={events}
                            setEvents={setEvents}
                            taskEvents={taskEvents}
                            setShowArrow={setShowArrow}
                            setShowChart={setShowChart}
                            tabValue={tabValue}
                            setTabValue={setTabValue}
                            pushToUnplanned={unassignRef}
                            setTabIndex={setTabIndex}
                            tabIndex={tabIndex}
                        />



                    ) : (
                        <div
                            className={darkMode ? "dark" : "light"}
                            style={{
                                overflowY: 'auto',
                                borderRadius: '15px',
                                scrollBehavior: 'smooth',
                                height: '85vh',
                                margin: 0,
                                padding: 0
                            }}
                        >


                            <TimelineCalendar
                                setSelectedUser={setSelectedUser}
                                canvasWidth={canvasWidth}
                                fetchTasks={fetchTasks}
                                setCanvasWidth={setCanvasWidth}
                                startDate={startDate}
                                endDate={endDate}
                                setStartDate={setStartDate}
                                setEndDate={setEndDate}
                                visibleTimeStart={visibleTimeStart}
                                visibleTimeEnd={visibleTimeEnd}
                                setVisibleTimeStart={setVisibleTimeStart}
                                setVisibleTimeEnd={setVisibleTimeEnd}
                                zoomIndex={zoomIndex}
                                setZoomIndex={setZoomIndex}
                                events={taskEvents}
                                key={timelineVersion} 
                                setEvents={setEvents}
                                taskEvents={taskEvents}
                                setTaskEvents={setTaskEvents}
                                getUsernameById={getUsernameById}
                                handleRightClick={handleRightClick}
                                contextMenu={contextMenu}
                                setContextMenu={setContextMenu}
                                allocateWorkingHours={allocateWorkingHours}
                                calculateDurationFromTimes={calculateDurationFromTimes}
                                users={users}
                                height="70vh"
                                actionButtons={
                                    <Box display="flex" alignItems="center" gap={2} flexShrink={0}>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                background: darkMode
                                                    ? "linear-gradient(120deg, #2feaa8, #028cf3)"
                                                    : "#fff",
                                                borderRadius: "5px",
                                                textTransform: "none",
                                                color: '#000',
                                                fontFamily: 'inherit',
                                                whiteSpace: 'nowrap',
                                                '&:hover': {
                                                    backgroundColor: ' #0D5EA6',
                                                    color: 'white'
                                                },
                                            }}
                                            onClick={() => {
                                                setNewEvent({
                                                    title: "",
                                                    description: "",
                                                    Project_Title: "",
                                                    priority: "",
                                                    assigned_to: "",
                                                    startTime: "",
                                                    endTime: "",
                                                    duration_minutes: "",
                                                    duration_display: "",
                                                    status: "pending"
                                                });
                                                setOpen(true);
                                            }}
                                        >
                                            Assign Task
                                        </Button>
                                    </Box>
                                }
                            />
                            <StatusLegendIndicator />


                            {deletedTask && (
                                <Snackbar
                                    open={true}
                                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                                    autoHideDuration={5000}
                                    onClose={() => setDeletedTask(null)}
                                >
                                    <Alert
                                        severity="success"
                                        variant="filled"
                                        sx={{
                                            backgroundColor: "#2E3B55",
                                            color: "#fff",
                                            borderRadius: 2,
                                            boxShadow: 3,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                        }}
                                        action={
                                            <Button
                                                size="small"
                                                onClick={handleUndoDelete}
                                                sx={{
                                                    color: "#00E676",
                                                    textTransform: "none",
                                                    fontWeight: 600,
                                                    '&:hover': { backgroundColor: 'rgba(0,230,118,0.1)' },
                                                }}
                                            >
                                                UNDO
                                            </Button>
                                        }
                                    >
                                        Task deleted
                                    </Alert>
                                </Snackbar>
                            )}
                        </div>
                    )}

                    {contextMenu && (
                        <Menu
                            open={Boolean(contextMenu)}
                            onClose={() => setContextMenu(null)}
                            anchorReference="anchorPosition"
                            anchorPosition={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
                            MenuListProps={{ disablePadding: true }} // ✅ remove inner padding
                            PaperProps={{
                                sx: {
                                    backgroundColor: 'white',
                                    border: '1px solid #1976d2',
                                    borderRadius: 1,
                                    padding: 0,
                                    margin: 0,
                                },
                            }}
                        >
                            {/* Edit Event */}
                            <MenuItem
                                onClick={() => {
                                    // console.log("📝 Context Menu data:", contextMenu.event);
                                    if (contextMenu.event) handleEditEvent(contextMenu.event);
                                    setContextMenu(null);
                                }}
                                sx={{
                                    backgroundColor: 'white',
                                    color: '#0D5EA6',
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                    },
                                    '&.Mui-selected': {
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: '#115293',
                                    },
                                }}
                            >
                                Edit Task
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    if (contextMenu?.event) {
                                        // console.log("🟡 Unassign clicked, event:", contextMenu.event);
                                        handleUnassignTask(contextMenu.event);
                                    }
                                    setContextMenu(null);
                                }}
                                sx={{
                                    backgroundColor: 'white',
                                    color: '#0D5EA6',
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                    },
                                }}
                            >
                                Unassign Task
                            </MenuItem>






                            {/* Delete Event */}
                            <MenuItem
                                onClick={() => {
                                    if (contextMenu.event) {
                                        setEventToDelete(contextMenu.event);
                                        setDeleteDialogOpen(true);
                                    }
                                    setContextMenu(null);
                                }}
                                sx={{
                                    backgroundColor: 'white',
                                    color: '#0D5EA6',
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                    },
                                    '&.Mui-selected': {
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: '#115293',
                                    },
                                }}
                            >
                                Delete
                            </MenuItem>
                        </Menu>

                    )}


                </Card>

                {!showChart && showArrow && (
                    <Box
                        sx={{
                            position: 'fixed',
                            top: '50%',
                            right: 10,
                            transform: 'translateY(-50%)',
                            zIndex: 999,
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            backgroundColor: '#0D5EA6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            '&:hover': {
                                backgroundColor: '#084c87',
                            },
                        }}
                        onClick={() => setShowChart(true)}
                    >
                        <ArrowForwardIosIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                )}
            </Box>
            <TaskForm
                open={open}
                onClose={() => setOpen(false)}
                initialEvent={newEvent}
                // isUserRequest={false}
                onSave={(createdOrUpdatedTask) => {
                    // existing AdminDashboard logic to update local lists:
                    if (createdOrUpdatedTask) {
                        // if it's update -> replace in events/taskEvents
                        setEvents(prev => prev.map(t => (String(t.id) === String(createdOrUpdatedTask.id) ? createdOrUpdatedTask : t)));
                        setTaskEvents(prev => prev.map(t => (String(t.id) === String(createdOrUpdatedTask.id) ? createdOrUpdatedTask : t)));
                        // if create -> add
                        if (!newEvent?.id) {
                            setEvents(prev => [...prev, createdOrUpdatedTask]);
                            setTaskEvents(prev => [...prev, createdOrUpdatedTask]);
                        }
                    }
                }}
            />
            <DeleteModal
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={async () => {
                    await handleDeleteTask(eventToDelete.id);
                    setDeleteDialogOpen(false);
                }}
                title="Confirm Delete"
                message={
                    <>
                        Are you sure you want to delete this task:&nbsp;
                        <strong>'{eventToDelete?.description}'</strong>?
                    </>
                }
            />
        </Box>
    );
}