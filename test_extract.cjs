const XLSX = require('xlsx');
const wb = XLSX.readFile('ListaPrecios (1).xlsx');
const sheet = wb.Sheets['PreciosM'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const parsePrice = str => {
  if (!str || str === '-') return null;
  const num = parseFloat(String(str).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
};

const products = [];
for (let i = 5; i < data.length; i++) {
  const row = data[i];
  const clave = row[0] ? String(row[0]).trim() : '';
  const desc = row[3] ? String(row[3]).trim() : '';
  
  if (clave && desc && clave !== desc) {
    const pNormal = parsePrice(row[8]);
    let pMayoreo = parsePrice(row[12]);
    if (pMayoreo === null) pMayoreo = parsePrice(row[11]);
    if (pMayoreo === null) pMayoreo = pNormal;
    
    products.push({ clave, desc, pNormal, pMayoreo });
  }
}

console.log(`Found ${products.length} products. First 10:`);
products.slice(0, 10).forEach(p => console.log(p));
