import fs from 'fs';
import dicomParser from 'dicom-parser';

const fileBytes = fs.readFileSync('http_test.dcm');
const byteArray = new Uint8Array(fileBytes);

try {
    const dataSet = dicomParser.parseDicom(byteArray);
    console.log("Transfer Syntax:", dataSet.string('x00020010'));
    console.log("Patient Name:", dataSet.string('x00100010'));
    console.log("Columns:", dataSet.uint16('x00280011'));
    console.log("Rows:", dataSet.uint16('x00280010'));
} catch (err) {
    console.error("Error parsing:", err);
}
