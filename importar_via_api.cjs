const XLSX = require('xlsx');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, 'ListaPrecios (1).xlsx');
const API_URL = 'http://localhost:3001/api/productos';

async function run() {
  console.log('Reading Excel file...');
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets['PreciosM'];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const parsePrice = str => {
    if (!str || str === '-') return null;
    const num = parseFloat(String(str).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  };

  const excelProducts = [];
  for (let i = 5; i < rawData.length; i++) {
    const row = rawData[i];
    const clave = row[0] ? String(row[0]).trim() : '';
    const desc = row[3] ? String(row[3]).trim() : '';
    
    if (clave && desc && clave !== desc) {
      const pNormal = parsePrice(row[8]) || 0;
      let pMayoreo = parsePrice(row[12]);
      if (pMayoreo === null) pMayoreo = parsePrice(row[11]);
      if (pMayoreo === null) pMayoreo = pNormal;
      
      excelProducts.push({ codigo: clave, nombre: desc, precioNormal: pNormal, precioMayoreo: pMayoreo });
    }
  }

  console.log(`Found ${excelProducts.length} products in Excel sheet.`);

  // 1. Get current products
  console.log('Fetching current products from running server...');
  const getRes = await fetch(API_URL);
  if (!getRes.ok) throw new Error(`Failed to fetch current products: ${getRes.statusText}`);
  const currentProducts = await getRes.json();
  console.log(`Server currently has ${currentProducts.length} products.`);

  // 2. Delete current products
  if (currentProducts.length > 0) {
    console.log(`Deleting ${currentProducts.length} current products...`);
    for (let i = 0; i < currentProducts.length; i++) {
      const p = currentProducts[i];
      const delRes = await fetch(`${API_URL}/${p.id}`, { method: 'DELETE' });
      if (!delRes.ok) {
        console.error(`Failed to delete product ${p.nombre} (${p.id})`);
      }
    }
    console.log('All previous products deleted from server memory.');
  }

  // 3. Post new products
  console.log(`Importing ${excelProducts.length} products into running server...`);
  let count = 0;
  for (const p of excelProducts) {
    const postRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    if (postRes.ok) {
      count++;
      if (count % 50 === 0) {
        console.log(`Imported ${count}/${excelProducts.length} products...`);
      }
    } else {
      const errText = await postRes.text();
      console.error(`Failed to import product ${p.nombre}: ${errText}`);
    }
  }

  console.log(`Done! Successfully imported ${count} products directly into the running server.`);
}

run().catch(console.error);
