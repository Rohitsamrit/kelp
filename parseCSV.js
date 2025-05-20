const fs = require("fs");

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const [headerLine, ...lines] = content.trim().split("\n");

  const headers = headerLine.split(",").map((h) => h.trim());

  return lines.map((line) => {
    const values = line.split(",").map((val) => val.trim());
    const obj = {};
    headers.forEach((key, index) => {
      obj[key] = values[index];
    });
    return obj;
  });
}

module.exports = parseCSV;
