/**
 * Script to generate the hospital SQLite database with realistic data.
 * Run with: node scripts/generate-db.mjs
 */
import initSqlJs from 'sql.js';
import {
    writeFileSync
} from 'fs';

const SQL = await initSqlJs();
const db = new SQL.Database();

// --- Schema ---
db.run(`
  CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    floor INTEGER NOT NULL,
    phone TEXT
  );

  CREATE TABLE doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    hire_date TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    insurance_number TEXT
  );

  CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 2,
    room_type TEXT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE diagnoses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    diagnosis_code TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  );

  CREATE TABLE medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    manufacturer TEXT,
    price REAL NOT NULL
  );

  CREATE TABLE prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diagnosis_id INTEGER NOT NULL,
    medication_id INTEGER NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id),
    FOREIGN KEY (medication_id) REFERENCES medications(id)
  );

  CREATE TABLE admissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    admission_date TEXT NOT NULL,
    discharge_date TEXT,
    reason TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    invoice_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );
`);

// --- Data Generation Helpers ---
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
    return arr[rand(0, arr.length - 1)];
}

function date(yearMin, yearMax) {
    const y = rand(yearMin, yearMax);
    const m = String(rand(1, 12)).padStart(2, '0');
    const d = String(rand(1, 28)).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// --- Departments ---
const departments = [
    'Kardiologie', 'Neurologie', 'Chirurgie', 'Orthopädie', 'Pädiatrie',
    'Onkologie', 'Dermatologie', 'Gynäkologie', 'Urologie', 'Psychiatrie',
    'Radiologie', 'Notaufnahme'
];
departments.forEach((name, i) => {
    db.run('INSERT INTO departments (name, floor, phone) VALUES (?, ?, ?)',
        [name, rand(1, 5), `030-${rand(1000000, 9999999)}`]);
});

// --- Doctors (50) ---
const firstNames = ['Anna', 'Thomas', 'Maria', 'Stefan', 'Julia', 'Michael', 'Laura', 'Andreas', 'Sarah', 'Christian', 'Lisa', 'Martin', 'Katharina', 'Daniel', 'Sophie', 'Markus', 'Elena', 'Tobias', 'Nina', 'Felix', 'Claudia', 'Jan', 'Monika', 'Peter', 'Eva'];
const lastNames = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Lehmann', 'König', 'Huber'];
const specializations = ['Chirurgie', 'Neurologie', 'Kardiologie', 'Orthopädie', 'Pädiatrie', 'Onkologie', 'Dermatologie', 'Allgemeinmedizin', 'Anästhesie', 'Radiologie'];

for (let i = 0; i < 50; i++) {
    db.run('INSERT INTO doctors (first_name, last_name, specialization, department_id, hire_date, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [pick(firstNames), pick(lastNames), pick(specializations), rand(1, 12), date(2005, 2023), `0170-${rand(1000000, 9999999)}`, `dr.${i}@hospital.de`]);
}

// --- Patients (500) ---
const patientFirstNames = ['Emma', 'Liam', 'Mia', 'Noah', 'Hannah', 'Elias', 'Sophia', 'Leon', 'Emilia', 'Ben', 'Lina', 'Paul', 'Marie', 'Finn', 'Clara', 'Lukas', 'Ella', 'Jonas', 'Lea', 'Maximilian', 'Anna', 'Felix', 'Lena', 'David', 'Amelie', 'Oscar', 'Johanna', 'Moritz', 'Charlotte', 'Anton', 'Ida', 'Theo', 'Frieda', 'Emil', 'Greta', 'Karl', 'Martha', 'Otto', 'Helene', 'Fritz'];
const patientLastNames = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Lehmann', 'König', 'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn', 'Vogel'];
const streets = ['Hauptstraße', 'Berliner Str.', 'Schillerweg', 'Goethestraße', 'Mozartplatz', 'Lindenallee', 'Parkstraße', 'Waldweg', 'Kirchgasse', 'Bahnhofstr.'];
const cities = ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dresden', 'Hannover'];

for (let i = 0; i < 500; i++) {
    const gender = Math.random() > 0.5 ? 'M' : 'F';
    db.run('INSERT INTO patients (first_name, last_name, birth_date, gender, phone, email, address, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [pick(patientFirstNames), pick(patientLastNames), date(1940, 2010), gender, `0${rand(151, 179)}-${rand(1000000, 9999999)}`, `patient${i}@mail.de`, `${pick(streets)} ${rand(1, 150)}, ${pick(cities)}`, `INS-${rand(100000, 999999)}`]);
}

// --- Rooms (100) ---
const roomTypes = ['Einzelzimmer', 'Doppelzimmer', 'Intensivstation', 'OP-Saal', 'Untersuchungsraum'];
for (let i = 0; i < 100; i++) {
    const type = pick(roomTypes);
    const cap = type === 'Einzelzimmer' ? 1 : type === 'Doppelzimmer' ? 2 : type === 'Intensivstation' ? 1 : 0;
    db.run('INSERT INTO rooms (room_number, department_id, capacity, room_type) VALUES (?, ?, ?, ?)',
        [`${rand(1, 5)}${String(rand(1, 30)).padStart(2, '0')}`, rand(1, 12), cap || rand(1, 4), type]);
}

// --- Appointments (2000) ---
const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
for (let i = 0; i < 2000; i++) {
    db.run('INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes) VALUES (?, ?, ?, ?, ?)',
        [rand(1, 500), rand(1, 50), date(2022, 2025), pick(statuses), Math.random() > 0.7 ? 'Kontrolluntersuchung' : null]);
}

// --- Diagnoses (1500) ---
const diagCodes = ['J06.9', 'I10', 'E11', 'M54.5', 'K21.0', 'F32.1', 'J45.0', 'N39.0', 'G43.0', 'L20.0', 'S72.0', 'C50.9', 'I25.1', 'E78.0', 'J18.9'];
const diagDescriptions = ['Akute Infektion der oberen Atemwege', 'Essentielle Hypertonie', 'Diabetes mellitus Typ 2', 'Kreuzschmerzen', 'Gastroösophageale Refluxkrankheit', 'Mittelgradige depressive Episode', 'Asthma bronchiale', 'Harnwegsinfektion', 'Migräne ohne Aura', 'Atopisches Ekzem', 'Oberschenkelfraktur', 'Brustkrebs', 'Koronare Herzkrankheit', 'Hyperlipidämie', 'Pneumonie'];
const severities = ['leicht', 'mittel', 'schwer', 'kritisch'];

for (let i = 0; i < 1500; i++) {
    const idx = rand(0, diagCodes.length - 1);
    db.run('INSERT INTO diagnoses (appointment_id, diagnosis_code, description, severity) VALUES (?, ?, ?, ?)',
        [rand(1, 2000), diagCodes[idx], diagDescriptions[idx], pick(severities)]);
}

// --- Medications (200) ---
const medNames = ['Ibuprofen', 'Paracetamol', 'Amoxicillin', 'Metformin', 'Omeprazol', 'Ramipril', 'Simvastatin', 'Bisoprolol', 'Pantoprazol', 'Diclofenac', 'Prednisolon', 'Ciprofloxacin', 'Metoprolol', 'Amlodipine', 'Clopidogrel', 'Insulin', 'Salbutamol', 'Fluoxetin', 'Gabapentin', 'Tramadol'];
const medCategories = ['Schmerzmittel', 'Antibiotikum', 'Antidiabetikum', 'Antihypertensivum', 'Protonenpumpenhemmer', 'Statin', 'Betablocker', 'Kortikosteroid', 'Bronchodilatator', 'Antidepressivum'];
const manufacturers = ['Ratiopharm', 'Hexal', 'Stada', 'Bayer', 'Novartis', 'Pfizer', 'Sanofi', 'AstraZeneca', 'Merck', 'Boehringer'];

for (let i = 0; i < 200; i++) {
    db.run('INSERT INTO medications (name, category, manufacturer, price) VALUES (?, ?, ?, ?)',
        [pick(medNames) + ` ${rand(50, 1000)}mg`, pick(medCategories), pick(manufacturers), (rand(200, 15000) / 100).toFixed(2)]);
}

// --- Prescriptions (3000) ---
const dosages = ['1 Tablette', '2 Tabletten', '5ml', '10ml', '1 Injektion', '2 Kapseln'];
const frequencies = ['1x täglich', '2x täglich', '3x täglich', 'alle 8 Stunden', 'bei Bedarf', '1x wöchentlich'];

for (let i = 0; i < 3000; i++) {
    const startD = date(2022, 2025);
    db.run('INSERT INTO prescriptions (diagnosis_id, medication_id, dosage, frequency, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
        [rand(1, 1500), rand(1, 200), pick(dosages), pick(frequencies), startD, Math.random() > 0.3 ? date(2025, 2026) : null]);
}

// --- Admissions (800) ---
const reasons = ['Geplante Operation', 'Notaufnahme', 'Beobachtung', 'Chemotherapie', 'Rehabilitation', 'Geburt', 'Intensivüberwachung'];
for (let i = 0; i < 800; i++) {
    const admDate = date(2022, 2025);
    db.run('INSERT INTO admissions (patient_id, room_id, admission_date, discharge_date, reason) VALUES (?, ?, ?, ?, ?)',
        [rand(1, 500), rand(1, 100), admDate, Math.random() > 0.2 ? date(2025, 2026) : null, pick(reasons)]);
}

// --- Invoices (1000) ---
const invStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
for (let i = 0; i < 1000; i++) {
    db.run('INSERT INTO invoices (patient_id, department_id, amount, invoice_date, status) VALUES (?, ?, ?, ?, ?)',
        [rand(1, 500), rand(1, 12), (rand(5000, 500000) / 100).toFixed(2), date(2022, 2025), pick(invStatuses)]);
}

// --- Export ---
const data = db.export();
writeFileSync('public/hospital.sqlite', Buffer.from(data));
console.log('✓ hospital.sqlite generated (public/hospital.sqlite)');
console.log(`  - 12 departments, 50 doctors, 500 patients`);
console.log(`  - 100 rooms, 2000 appointments, 1500 diagnoses`);
console.log(`  - 200 medications, 3000 prescriptions`);
console.log(`  - 800 admissions, 1000 invoices`);
db.close();