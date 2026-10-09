import { initDb, query } from "./db.js";

const padTwo = (value) => String(value).padStart(2, "0");
const parseISTDateTime = (dateString, timeString) => new Date(`${dateString}T${timeString}:00+05:30`).getTime();
const getISTDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
};

const getCurrentISTMonth = () => {
  const { year, month } = getISTDateParts();
  return `${year}-${padTwo(month)}`;
};

const getSeedDates = () => {
  const { year, month, day } = getISTDateParts();
  const lastDay = Math.max(1, day - 1);
  const dates = [];

  for (let currentDay = 1; currentDay <= lastDay; currentDay += 1) {
    const dateString = `${year}-${padTwo(month)}-${padTwo(currentDay)}`;
    const weekDay = new Date(`${dateString}T00:00:00+05:30`).getUTCDay();
    if (weekDay === 0 || weekDay === 6) continue;
    dates.push(dateString);
  }

  return dates;
};

const getCheckInTime = (employeeIndex, dateIndex) => {
  const latePattern = (employeeIndex + dateIndex) % 5;
  if (latePattern === 0) return "09:48";
  if (latePattern === 1) return "09:36";
  return "09:24";
};

const getCheckOutTime = (employeeIndex, dateIndex) => {
  const overtimePattern = (employeeIndex + dateIndex) % 4;
  if (overtimePattern === 0) return "19:12";
  if (overtimePattern === 1) return "18:42";
  return "18:18";
};

const getWorkMode = (employeeIndex, dateIndex) => ((employeeIndex + dateIndex) % 4 === 0 ? "WFH" : "WFO");

const seedAttendance = async () => {
  await initDb();
  const employeesRes = await query("SELECT id FROM employees WHERE active = true ORDER BY id");
  const employees = employeesRes.rows;
  const dates = getSeedDates();
  const month = getCurrentISTMonth();

  if (!employees.length) {
    console.log("No active employees found.");
    return;
  }

  if (!dates.length) {
    console.log("No eligible workdays found to seed.");
    return;
  }

  let upserted = 0;

  for (const [employeeIndex, employee] of employees.entries()) {
    for (const [dateIndex, attendanceDate] of dates.entries()) {
      const checkInAt = parseISTDateTime(attendanceDate, getCheckInTime(employeeIndex, dateIndex));
      const checkOutAt = parseISTDateTime(attendanceDate, getCheckOutTime(employeeIndex, dateIndex));
      const totalHours = ((checkOutAt - checkInAt) / 3600000).toFixed(2);
      const workMode = getWorkMode(employeeIndex, dateIndex);

      await query(
        `
          INSERT INTO attendance (
            employee_id,
            attendance_date,
            check_in_at,
            check_out_at,
            total_hours,
            status,
            work_mode,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, 'OUT', $6, NOW())
          ON CONFLICT (employee_id, attendance_date) DO UPDATE
          SET check_in_at = EXCLUDED.check_in_at,
              check_out_at = EXCLUDED.check_out_at,
              total_hours = EXCLUDED.total_hours,
              status = EXCLUDED.status,
              work_mode = EXCLUDED.work_mode,
              updated_at = NOW()
        `,
        [employee.id, attendanceDate, checkInAt, checkOutAt, totalHours, workMode]
      );
      upserted += 1;
    }
  }

  console.log(`Sample attendance seeded for ${employees.length} employees across ${dates.length} workdays in ${month}.`);
  console.log(`Attendance rows upserted: ${upserted}`);
};

seedAttendance()
  .catch((error) => {
    console.error("Attendance seed failed:", error.message);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
