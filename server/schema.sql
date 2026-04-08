CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  createdAt TEXT,
  topic TEXT,
  quiz TEXT,
  responses TEXT,
  result TEXT
);

DROP TABLE IF EXISTS applications;

CREATE TABLE IF NOT EXISTS nonprofits (
  id TEXT PRIMARY KEY,
  name TEXT,
  mission TEXT,
  sector TEXT,
  maturity TEXT,
  program_efficiency REAL,
  revenue_growth REAL,
  sustainability REAL,
  scale REAL,
  location TEXT
);
