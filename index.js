const express = require("express");
const dotenv = require("dotenv");
const parseCSV = require("./parseCSV");
const pool = require("./db");
const app = express();
dotenv.config();

app.use(express.json());

function expandDotNotation(obj) {
  const result = {};

  for (const key in obj) {
    const value = obj[key];
    const keys = key.split(".");
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const part = keys[i];
      if (i === keys.length - 1) {
        current[part] = value;
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return result;
}

app.post("/upload", async (req, res) => {
  const records = parseCSV(process.env.CSV_FILE_PATH);
  let ageGroups = { "<20": 0, "20-40": 0, "40-60": 0, ">60": 0 };
  const responseObjects = [];

  try {
    for (const item of records) {
      const expanded = expandDotNotation(item);

      const firstName = expanded.name?.firstName || "";
      const lastName = expanded.name?.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      const age = parseInt(expanded.age) || 0;

      const address = expanded.address || {};

      delete expanded.name;
      delete expanded.age;
      delete expanded.address;

      const additionalInfo = expanded;

      await pool.query(
        `INSERT INTO users(name, age, address, additional_info) VALUES($1, $2, $3, $4)`,
        [fullName, age, JSON.stringify(address), JSON.stringify(additionalInfo)]
      );

      if (age < 20) ageGroups["<20"]++;
      else if (age <= 40) ageGroups["20-40"]++;
      else if (age <= 60) ageGroups["40-60"]++;
      else ageGroups[">60"]++;

      responseObjects.push({
        name: { firstName, lastName },
        age,
        address,
        additionalInfo,
      });
    }

    const total = records.length;
    console.log("\n Age Distribution Report:");
    for (let group in ageGroups) {
      let percent = ((ageGroups[group] / total) * 100).toFixed(2);
      console.log(`${group}: ${percent}%`);
    }

    res.status(200).json({
      message: "CSV uploaded and report generated",
      users: responseObjects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(3000, () => {
  console.log(" Server started on port 3000");
});
