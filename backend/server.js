const express = require("express");
const cors = require("cors");

const templateRoutes = require("./routes/templates");
const excelRoutes = require("./routes/excel");
const certificateRoutes = require("./routes/certificates");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/templates", templateRoutes);
app.use("/excel", excelRoutes);
app.use("/certificate", certificateRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});