import path from "path";
import fs from "fs";

let url = "https://api.theprivypursuit.com/api";

const logDir = path.join(process.cwd(), "data", "logs");
const logFilePath = path.join(logDir, "published_products_log.csv");

// Ensure `data/logs` folder exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Ensure log file has headers
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, "sku_tpp,sku_ori,price,timestamp\n");
}
// Function to log product
function logPublishedProduct(mappedProduct) {
  const logLine = `${mappedProduct.sku_tpp},${mappedProduct.sku_ori},${
    mappedProduct.price
  },${new Date().toISOString()}\n`;
  fs.appendFileSync(logFilePath, logLine);
}

export async function saveProductToDB(mappedProduct) {
  console.log(mappedProduct)
  try {
    const response = await fetch(`${url}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mappedProduct),
    });

    const text = await response.text(); // safe parse
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error(
        `Invalid JSON response for SKU ${mappedProduct.sku_tpp}:`,
        text
      );
      return;
    }
    console.log(`Product pushed: ${mappedProduct.sku_tpp} | Response:`);

    console.log(`Product pushed: ${mappedProduct.sku_tpp} | Response:`, data);

    logPublishedProduct(mappedProduct);

    return data;
  } catch (err) {
    console.error(`Error pushing product ${mappedProduct.sku_tpp}:`, err);
  }
}
