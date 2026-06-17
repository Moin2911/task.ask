import { fetchTrenbeProducts } from "../services/fetchTrenbe.mjs";
import { cleanTrenbeProduct } from "../utils/cleanText.mjs";
import { APPROVED_BRANDS } from "../utils/Approvedbrand.mjs";
import { mapTrenbeProduct } from "../utils/mappings.mjs";
import { saveProductToDB } from "../config/db.mjs";

//  Helper: retry wrapper 
async function retry(fn, attempts = 5, delayMs = 5000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`Attempt ${i} failed:`, err.message);
      if (i === attempts) throw err;
      console.log(`Retrying in ${delayMs / 1000}s...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}



//  Fetch existing SKUs with retry 
async function fetchExistingSkus() {
  const url = "https://api.theprivypursuit.com/api/products/skusori?seller=TB&status=ACTIVE&limit=-1";

  return retry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.skus)) throw new Error("Unexpected API response structure");
    return data.skus;
  });
}

//  Main 
export async function main() {
  console.log(" Fetching Trenbe New Arrivals...");

  //  Fetch Trenbe products safely 
  let rawProducts = [];
  try {
    rawProducts = await fetchTrenbeProducts();
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      console.log("No products from Trenbe. Exiting safely.");
      return;
    }
    console.log(` Received ${rawProducts.length} products`);
  } catch (err) {
    console.error("Trenbe API error. Stopping script safely:", err.message);
    return;
  }

  //  Fetch existing SKUs with retries
  let existingSkus = [];
  try {
    existingSkus = await fetchExistingSkus();
  } catch (err) {
    console.error("Failed to fetch existing SKUs after retries. Aborting safely:", err.message);
    return;
  }

  const existingSkuSet = new Set(existingSkus);
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const p of rawProducts) {
    let skip = false;
    const partner_sku = p.productId?.trim();
    console.log(partner_sku);

    const cleanData = cleanTrenbeProduct(p);

    // Skip if SKU exists
    if (existingSkuSet.has(partner_sku)) {
      console.log(`Skipping existing product (partner_sku: ${partner_sku})`);
      totalSkipped++;
      continue;
    }

    // Allowed conditions only
    if (!["A+", "A", "S", "S+", "NEW"].includes(cleanData.condition)) {
      console.log(` Skipping SKU ${cleanData.sku} (Condition: ${cleanData.condition})`);
      totalSkipped++;
      continue;
    }

    // Skip if color missing
    if (!cleanData.color) {
      console.log(` Skipping SKU ${cleanData.sku} (Color missing)`);
      totalSkipped++;
      continue;
    }

    // Skip if brand not approved
    if (!APPROVED_BRANDS.has(cleanData.brandName?.toUpperCase())) {
      console.log(` Skipping (Brand not allowed): ${cleanData.brandName} | SKU: ${cleanData.sku}`);
      totalSkipped++;
      continue;
    }

    // Map product
    const mapped = mapTrenbeProduct(cleanData);

    // Skip if essential mapping missing
    if (!mapped.brand || !mapped.color || !mapped.material || !mapped.product_type) {
      console.log(` Skipping incomplete mapping → ${cleanData.title}`);
      totalSkipped++;
      continue;
    }

    //  Save to DB with retry
    try {
      const data = await retry(() => saveProductToDB(mapped));
      console.log("Inserted:", data.title);

      totalInserted++;
      // console.log("Inserted:", data.title, data.sku_tpp);

      // break;
    } catch (err) {
      console.error(`Failed to insert SKU ${mapped.sku} after retries. Skipping safely.`);
      totalSkipped++;
      continue;
    }
  }

  console.log("\n---- SUMMARY ----");
  console.log(` Received ${rawProducts.length} products`);
  console.log(` Total Accepted: ${totalInserted}`);
  console.log(` Total Skipped: ${totalSkipped}`);
  console.log("DONE");
}

// Run main
main();

// ---------------- Safety net ----------------
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection caught:", err);
});





// mapped data export into csv or json

// import { fetchTrenbeProducts } from "../services/fetchTrenbe.mjs";
// import { cleanTrenbeProduct } from "../utils/cleanText.mjs";
// import { APPROVED_BRANDS } from "../utils/Approvedbrand.mjs";
// import { mapTrenbeProduct } from "../utils/mappings.mjs";
// import fs from "fs";
// import path from "path";
// import { Parser as Json2CsvParser } from "json2csv";



// const EXPORT_AS_CSV = false; // true = CSV, false = JSON


// // Helper: retry wrapper

// async function retry(fn, attempts = 5, delayMs = 5000) {
//   for (let i = 1; i <= attempts; i++) {
//     try {
//       return await fn();
//     } catch (err) {
//       console.error(`Attempt ${i} failed:`, err.message);
//       if (i === attempts) throw err;
//       console.log(`Retrying in ${delayMs / 1000}s...`);
//       await new Promise(res => setTimeout(res, delayMs));
//     }
//   }
// }

// // Fetch existing SKUs
// async function fetchExistingSkus() {
//   const url =
//     "https://api.theprivypursuit.com/api/products/skusori?seller=TB&status=ACTIVE&limit=-1";

//   return retry(async () => {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`API request failed: ${res.status}`);
//     const data = await res.json();
//     if (!Array.isArray(data.skus))
//       throw new Error("Unexpected API response structure");
//     return data.skus;
//   });
// }

// //  Export helper
// function exportData(filename, data) {
//   const filePath = path.resolve(filename);
//   if (EXPORT_AS_CSV) {
//     const parser = new Json2CsvParser({ flatten: true });
//     const csv = parser.parse(data);
//     fs.writeFileSync(filePath.replace(".json", ".csv"), csv, "utf8");
//     console.log(`Saved CSV: ${filePath.replace(".json", ".csv")}`);
//   } else {
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
//     console.log(`Saved JSON: ${filePath}`);
//   }
// }

// //  Main
// export async function main() {
//   console.log("Fetching Trenbe New Arrivals...");

//   let rawProducts = [];
//   try {
//     rawProducts = await fetchTrenbeProducts();
//     if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
//       console.log("No products from Trenbe. Exiting safely.");
//       return;
//     }
//     console.log(`Received ${rawProducts.length} products`);
//   } catch (err) {
//     console.error("Trenbe API error. Stopping safely:", err.message);
//     return;
//   }

//   let existingSkus = [];
//   try {
//     existingSkus = await fetchExistingSkus();
//   } catch (err) {
//     console.error("Failed to fetch existing SKUs:", err.message);
//     return;
//   }

//   const existingSkuSet = new Set(existingSkus);

//   let totalInserted = 0;
//   let totalSkipped = 0;
//   let processedCount = 0;
//   const MAX_PRODUCTS = 5000;
//   //  JSON containers
//   const successProducts = [];
//   const skippedProducts = [];
//   const errorProducts = [];

//   for (const p of rawProducts) {

//     // processedCount++;
//     // if (processedCount >= MAX_PRODUCTS) {
//     //   console.log(`\n Stopped after ${MAX_PRODUCTS} products`);
//     //   break;
//     // }
//     const partner_sku = p.productId?.trim();
//     const cleanData = cleanTrenbeProduct(p);

//     // SKU exists
//     if (existingSkuSet.has(partner_sku)) {
//       skippedProducts.push({
//         partner_sku,
//         title: cleanData.title,
//         reason: "SKU_ALREADY_EXISTS"
//       });
//       totalSkipped++;
//       continue;
//     }


//     if (!["NEW", "S", "S+", "A+", "A"].includes(cleanData.condition)) {
//       skippedProducts.push({
//         partner_sku,
//         title: cleanData.title,
//         reason: "INVALID_CONDITION",
//         condition: cleanData.condition
//       });
//       totalSkipped++;
//       continue;
//     }


//     if (!cleanData.color) {
//       skippedProducts.push({
//         partner_sku,
//         title: cleanData.title,
//         reason: "COLOR_MISSING_IN_DESCRIPTION"
//       });
//       totalSkipped++;
//       continue;
//     }


//     if (!APPROVED_BRANDS.has(cleanData.brandName?.toUpperCase())) {
//       skippedProducts.push({
//         partner_sku,
//         title: cleanData.title,
//         reason: "BRAND_NOT_APPROVED",
//         brand: cleanData.brandName
//       });
//       totalSkipped++;
//       continue;
//     }


//     const mapped = mapTrenbeProduct(cleanData);

//     const missingFields = [];
//     if (!mapped.brand) missingFields.push("brand");
//     if (!mapped.color) missingFields.push("color");
//     if (!mapped.material) missingFields.push("material");
//     if (!mapped.product_type) missingFields.push("product_type");

//     if (missingFields.length > 0) {
//       const errorRow = {
//         partner_sku,
//         title: cleanData.title,
//         brand: cleanData.brandName,
//         reason: "INCOMPLETE_MAPPING",
//         missing_fields: missingFields.join(", ")
//       };

//       errorProducts.push(errorRow);
//       skippedProducts.push(errorRow);

//       totalSkipped++;
//       continue;
//     }

//     successProducts.push(mapped);
//     console.log("Prepared for MySQL:", mapped.sku);
//     totalInserted++;


//   }

//   exportData("./trenbe_output_for_mysql.json", successProducts);
//   exportData("./trenbe_skipped_products.json", skippedProducts);
//   exportData("./trenbe_mapping_errors.json", errorProducts);

//   console.log("\n---- SUMMARY ----");
//   console.log(`Received: ${rawProducts.length}`);
//   console.log(`Prepared for MySQL: ${totalInserted}`);
//   console.log(`Skipped: ${totalSkipped}`);
//   console.log("DONE");
// }

// main();

// process.on("unhandledRejection", err => {
//   console.error("Unhandled rejection caught:", err);
// });








// Rejected raw products export (no mapping, only raw + reject reason)

// import { fetchTrenbeProducts } from "../services/fetchTrenbe.mjs";
// import { APPROVED_BRANDS } from "../utils/Approvedbrand.mjs";
// import { mapTrenbeProduct } from "../utils/mappings.mjs";
// import fs from "fs";
// import path from "path";
// import { Parser as Json2CsvParser } from "json2csv";

// const EXPORT_AS_CSV = true; // true = CSV, false = JSON

// // Approved product types list
// const APPROVED_PRODUCT_TYPES = new Set([
//   "BACKPACKS",
//   "BAG CHARMS",
//   "BELTS",
//   "BRACELETS",
//   "BRIEFCASES",
//   "BROOCHES",
//   "CASES",
//   "CLUTCH BAGS",
//   "CROSSBODY BAGS",
//   "CUFFLINKS",
//   "EARRINGS",
//   "GLOVES",
//   "HANDBAGS",
//   "HATS",
//   "KEY RINGS",
//   "LAPTOP BAGS",
//   "NECKLACES",
//   "PENDANTS",
//   "PENS",
//   "RINGS",
//   "SCARVES",
//   "SHOULDER BAGS",
//   "SMALL BAGS",
//   "SUNGLASSES",
//   "TIES",
//   "TOTE BAGS",
//   "TRAVEL BAGS",
//   "WALLETS",
//   "WATCHES"
// ]);

// // Helper: retry wrapper
// async function retry(fn, attempts = 5, delayMs = 5000) {
//   for (let i = 1; i <= attempts; i++) {
//     try {
//       return await fn();
//     } catch (err) {
//       console.error(`Attempt ${i} failed:`, err.message);
//       if (i === attempts) throw err;
//       console.log(`Retrying in ${delayMs / 1000}s...`);
//       await new Promise(res => setTimeout(res, delayMs));
//     }
//   }
// }

// // Fetch existing SKUs
// async function fetchExistingSkus() {
//   const url =
//     "https://api.theprivypursuit.com/api/products/skusori?seller=TB&status=ACTIVE&limit=-1";

//   return retry(async () => {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`API request failed: ${res.status}`);
//     const data = await res.json();
//     if (!Array.isArray(data.skus))
//       throw new Error("Unexpected API response structure");
//     return data.skus;
//   });
// }

// //  Export helper
// function exportData(filename, data) {
//   if (data.length === 0) {
//     console.log(`No data to export for ${filename}`);
//     return;
//   }

//   const filePath = path.resolve(filename);
//   if (EXPORT_AS_CSV) {
//     const parser = new Json2CsvParser({ flatten: true });
//     const csv = parser.parse(data);
//     fs.writeFileSync(filePath.replace(".json", ".csv"), csv, "utf8");
//     console.log(`Saved CSV: ${filePath.replace(".json", ".csv")}`);
//   } else {
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
//     console.log(`Saved JSON: ${filePath}`);
//   }
// }

// //  Main
// export async function main() {
//   console.log("Fetching Trenbe New Arrivals...");

//   let rawProducts = [];
//   try {
//     rawProducts = await fetchTrenbeProducts();
//     if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
//       console.log("No products from Trenbe. Exiting safely.");
//       return;
//     }
//     console.log(`Received ${rawProducts.length} products`);
//   } catch (err) {
//     console.error("Trenbe API error. Stopping safely:", err.message);
//     return;
//   }

//   let existingSkus = [];
//   try {
//     existingSkus = await fetchExistingSkus();
//   } catch (err) {
//     console.error("Failed to fetch existing SKUs:", err.message);
//     return;
//   }

//   const existingSkuSet = new Set(existingSkus);

//   let totalRejected = 0;
//   const rejectedProducts = [];

//   for (const p of rawProducts) {
//     const partner_sku = p.productId?.trim();

//     // Attempt mapping first to generate product_type
//     const mapped = mapTrenbeProduct(p);

//     // Skip products whose mapped product_type is not approved
//     if (!APPROVED_PRODUCT_TYPES.has(mapped.product_type?.toUpperCase())) continue;

//     let rejectReason = "";

//     if (existingSkuSet.has(partner_sku)) {
//       rejectReason = "SKU_ALREADY_EXISTS";
//     } else if (!["NEW", "S", "S+", "A+", "A"].includes(p.condition)) {
//       rejectReason = "INVALID_CONDITION";
//     } else if (!p.color) {
//       rejectReason = "COLOR_MISSING_IN_DESCRIPTION";
//     } else if (!APPROVED_BRANDS.has(p.brand?.toUpperCase())) {
//       rejectReason = "BRAND_NOT_APPROVED";
//     } else {
//       const missingFields = [];
//       if (!mapped.brand) missingFields.push("brand");
//       if (!mapped.color) missingFields.push("color");
//       if (!mapped.material) missingFields.push("material");
//       if (!mapped.product_type) missingFields.push("product_type");

//       if (missingFields.length > 0) {
//         rejectReason = "INCOMPLETE_MAPPING: " + missingFields.join(", ");
//       }
//     }

//     if (rejectReason) {
//       rejectedProducts.push({
//         ...p, // raw Trenbe row
//         product_type: mapped.product_type || "UNMAPPED",
//         reject_reason: rejectReason
//       });
//       totalRejected++;
//     }
//   }

//   // Export only rejected raw products
//   exportData("./trenbe_rejected_raw_products.json", rejectedProducts);

//   console.log("\n---- SUMMARY ----");
//   console.log(`Total products received: ${rawProducts.length}`);
//   console.log(`Total rejected raw products exported: ${totalRejected}`);
//   console.log("DONE");
// }

// main();

// process.on("unhandledRejection", err => {
//   console.error("Unhandled rejection caught:", err);
// });
















// // mapped data export into csv or json
// import { fetchTrenbeProducts } from "../services/fetchTrenbe.mjs";
// import { cleanTrenbeProduct } from "../utils/cleanText.mjs";
// import { APPROVED_BRANDS } from "../utils/Approvedbrand.mjs";
// import { mapTrenbeProduct } from "../utils/mappings.mjs";
// import fs from "fs";
// import path from "path";
// import { Parser as Json2CsvParser } from "json2csv";

// const EXPORT_AS_CSV = true; // true = CSV, false = JSON


// // 🔹 CHANGE: Approved product types list
// const APPROVED_PRODUCT_TYPES = new Set([
//   "BACKPACKS",
//   "BAG CHARMS",
//   "BELTS",
//   "BRACELETS",
//   "BRIEFCASES",
//   "BROOCHES",
//   "CASES",
//   "CLUTCH BAGS",
//   "CROSSBODY BAGS",
//   "CUFFLINKS",
//   "EARRINGS",
//   "GLOVES",
//   "HANDBAGS",
//   "HATS",
//   "KEY RINGS",
//   "LAPTOP BAGS",
//   "NECKLACES",
//   "PENDANTS",
//   "PENS",
//   "RINGS",
//   "SCARVES",
//   "SHOULDER BAGS",
//   "SMALL BAGS",
//   "SUNGLASSES",
//   "TIES",
//   "TOTE BAGS",
//   "TRAVEL BAGS",
//   "WALLETS",
//   "WATCHES"
// ]);


// // Helper: retry wrapper
// async function retry(fn, attempts = 5, delayMs = 5000) {
//   for (let i = 1; i <= attempts; i++) {
//     try {
//       return await fn();
//     } catch (err) {
//       console.error(`Attempt ${i} failed:`, err.message);
//       if (i === attempts) throw err;
//       console.log(`Retrying in ${delayMs / 1000}s...`);
//       await new Promise(res => setTimeout(res, delayMs));
//     }
//   }
// }


// // Fetch existing SKUs
// async function fetchExistingSkus() {
//   const url =
//     "https://api.theprivypursuit.com/api/products/skusori?seller=TB&status=ACTIVE&limit=-1";

//   return retry(async () => {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`API request failed: ${res.status}`);
//     const data = await res.json();
//     if (!Array.isArray(data.skus))
//       throw new Error("Unexpected API response structure");
//     return data.skus;
//   });
// }


// // Export helper
// function exportData(filename, data) {
//   const filePath = path.resolve(filename);
//   if (EXPORT_AS_CSV) {
//     const parser = new Json2CsvParser({ flatten: true });
//     const csv = parser.parse(data);
//     fs.writeFileSync(filePath.replace(".json", ".csv"), csv, "utf8");
//     console.log(`Saved CSV: ${filePath.replace(".json", ".csv")}`);
//   } else {
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
//     console.log(`Saved JSON: ${filePath}`);
//   }
// }


// // Main
// export async function main() {
//   console.log("Fetching Trenbe New Arrivals...");

//   let rawProducts = [];
//   try {
//     rawProducts = await fetchTrenbeProducts();
//     if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
//       console.log("No products from Trenbe. Exiting safely.");
//       return;
//     }
//     console.log(`Received ${rawProducts.length} products`);
//   } catch (err) {
//     console.error("Trenbe API error. Stopping safely:", err.message);
//     return;
//   }

//   let existingSkus = [];
//   try {
//     existingSkus = await fetchExistingSkus();
//   } catch (err) {
//     console.error("Failed to fetch existing SKUs:", err.message);
//     return;
//   }

//   const existingSkuSet = new Set(existingSkus);

//   let totalInserted = 0;
//   let totalSkipped = 0;

//   const successProducts = [];
//   const skippedProducts = [];
//   const errorProducts = [];

//   // 🔹 CHANGE: rejected clean data container
//   const rejectedCleanData = [];

//   for (const p of rawProducts) {
//     const partner_sku = p.productId?.trim();
//     const cleanData = cleanTrenbeProduct(p);

//     // 🔹 CHANGE: mapped created early
//     const mapped = mapTrenbeProduct(cleanData);

//     // 🔹 CHANGE: helper condition
//     const shouldExportRejectedCleanData =
//       mapped?.product_type &&
//       APPROVED_PRODUCT_TYPES.has(mapped.product_type);

//     // SKU exists
//     if (existingSkuSet.has(partner_sku)) {
//       skippedProducts.push({
//         partner_sku,
//         title: cleanData.title,
//         reason: "SKU_ALREADY_EXISTS"
//       });

//       if (shouldExportRejectedCleanData) {
//         rejectedCleanData.push(cleanData);
//       }

//       totalSkipped++;
//       continue;
//     }

//     // Condition check
//     if (!["NEW", "S", "S+", "A+", "A"].includes(cleanData.condition)) {
//       skippedProducts.push({
//         partner_sku,
//         title: cleanData.title,
//         reason: "INVALID_CONDITION",
//         condition: cleanData.condition
//       });

//       if (shouldExportRejectedCleanData) {
//         rejectedCleanData.push(cleanData);
//       }

//       totalSkipped++;
//       continue;
//     }

//     // Color missing
//     if (!cleanData.color) {
//       skippedProducts.push({
//         partner_sku,
//         title: cleanData.title,
//         reason: "COLOR_MISSING_IN_DESCRIPTION"
//       });

//       if (shouldExportRejectedCleanData) {
//         rejectedCleanData.push(cleanData);
//       }

//       totalSkipped++;
//       continue;
//     }

//     // Brand not approved
//     if (!APPROVED_BRANDS.has(cleanData.brandName?.toUpperCase())) {
//       skippedProducts.push({
//         partner_sku,
//         title: cleanData.title,
//         reason: "BRAND_NOT_APPROVED",
//         brand: cleanData.brandName
//       });

//       if (shouldExportRejectedCleanData) {
//         rejectedCleanData.push(cleanData);
//       }

//       totalSkipped++;
//       continue;
//     }

//     const missingFields = [];
//     if (!mapped.brand) missingFields.push("brand");
//     if (!mapped.color) missingFields.push("color");
//     if (!mapped.material) missingFields.push("material");
//     if (!mapped.product_type) missingFields.push("product_type");

//     if (missingFields.length > 0) {
//       const errorRow = {
//         partner_sku,
//         title: cleanData.title,
//         brand: cleanData.brandName,
//         reason: "INCOMPLETE_MAPPING",
//         missing_fields: missingFields.join(", ")
//       };

//       errorProducts.push(errorRow);
//       skippedProducts.push(errorRow);

//       if (shouldExportRejectedCleanData) {
//         rejectedCleanData.push(cleanData);
//       }

//       totalSkipped++;
//       continue;
//     }

//     successProducts.push(mapped);
//     console.log("Prepared for MySQL:", mapped.sku);
//     totalInserted++;
//   }

//   exportData("./trenbe_output_for_mysql.json", successProducts);
//   exportData("./trenbe_skipped_products.json", skippedProducts);
//   exportData("./trenbe_mapping_errors.json", errorProducts);

//   //  CHANGE: only approved product_type cleanData exported
//   exportData("./trenbe_rejected_clean_data.json", rejectedCleanData);

//   console.log("\n---- SUMMARY ----");
//   console.log(`Received: ${rawProducts.length}`);
//   console.log(`Prepared for MySQL: ${totalInserted}`);
//   console.log(`Skipped: ${totalSkipped}`);
//   console.log("DONE");
// }

// main();


