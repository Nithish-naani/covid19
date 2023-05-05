const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("This Server is running in http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Return List of States
app.get("/states/", async (request, response) => {
  const getQuery = `SELECT * FROM state`;
  const stateArray = await db.all(getQuery);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//Returns On StateId
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT * FROM state
    WHERE state_id = ${stateId};`;
  const findState = await db.get(query);
  response.send(convertDbObjectToResponseObject(findState));
});

//Creating a District
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `INSERT INTO district
    (district_name, state_id, cases, cured, active, deaths)
    VALUES('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');`;
  const newDistrict = await db.run(query);
  response.send("District Successfully Added");
});

//Returns District Id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `SELECT * FROM district 
    WHERE district_id = ${districtId};`;
  const district = await db.get(query);
  response.send(convertDbObjectToResponseObject(district));
});

//Delete Districts
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `DELETE FROM district 
    WHERE district_id = ${districtId};`;
  const district = await db.run(query);
  response.send("District Removed");
});

//Update District
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
    WHERE 
    district_id = ${districtId};`;
  const update = await db.run(query);
  response.send("District Details Updated");
});

const convertNewResponse = (newObject) => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  };
};

//Sum
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT SUM(cases) AS cases,
    SUM(cured) AS cured,
    SUM(active) AS active,
    SUM(deaths) AS deaths
    FROM DISTRICT
    WHERE state_id = ${stateId};`;
  const total = await db.get(query);
  response.send(convertNewResponse(total));
});

//district Name
app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const query = `SELECT state_name FROM state INNER JOIN district 
  ON state.state_id = district.state_id
    WHERE district.district_id = ${districtId};`;
  const name = await db.get(query);
  response.send(convertDbObjectToResponseObject(name));
});

module.exports = app;
