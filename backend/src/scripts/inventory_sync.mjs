import fs from "fs/promises";
import { fetchTrenbeProducts } from "../services/fetchTrenbe.mjs";

const CENTRAL_SYSTEM_API_URL = "https://api.theprivypursuit.com/api";
const SOURCE_MODULE_ID = "tb_module";
const SKU_CHUNK_SIZE = 2000;
const MAX_RETRIES = 5;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function getAllTrenbeSKUs() {
  try {
    console.log("Fetching data from Trenbe...");
    const products = await fetchTrenbeProducts();
    if (!products || !Array.isArray(products)) throw new Error("No products received");

    const skus = products
      .map((p) => p.productId)
      .filter(Boolean)
      .map((s) => s.trim());

    console.log(`Extracted ${skus.length} SKUs from Trenbe.`);
    console.log(skus.slice(0, 10), "..."); // show first few for verification
    return skus;
  } catch (err) {
    console.error(`Trenbe API error. Stopping script safely: ${err.message}`);
    return [];
  }
}

async function threePhaseSync(skus) {
  // console.time("Trenbe Full Sync Time");
  let syncId;

  // Phase 1: Initialize Sync
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Phase 1: Initializing sync (attempt ${attempt})`);
      const res = await fetch(`${CENTRAL_SYSTEM_API_URL}/products/sync/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_module_id: SOURCE_MODULE_ID }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      syncId = data.sync_id;
      console.log("Sync initialized:", data);
      break;
    } catch (err) {
      console.warn(`Phase 1 attempt ${attempt} failed: ${err.message}`);
      if (attempt === MAX_RETRIES) {
        console.error("Phase 1 failed after max retries. Aborting safely.");
        return;
      }
      await delay(2000);
    }
  }

  // Phase 2: Stream SKUs
  for (let i = 0; i < skus.length; i += SKU_CHUNK_SIZE) {
    const chunk = skus.slice(i, i + SKU_CHUNK_SIZE);
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Phase 2: Streaming batch ${i / SKU_CHUNK_SIZE + 1} (attempt ${attempt})`);
        const res = await fetch(`${CENTRAL_SYSTEM_API_URL}/products/sync/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sync_id: syncId, sku_oris: chunk }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(data.message);
        break;
      } catch (err) {
        console.warn(`Batch ${i / SKU_CHUNK_SIZE + 1} attempt ${attempt} failed: ${err.message}`);
        if (attempt === MAX_RETRIES) {
          console.error("Phase 2 failed after max retries. Aborting safely.");
          return;
        }
        await delay(2000);
      }
    }
  }

  // Phase 3: Finalize Sync
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Phase 3: Finalizing sync (attempt ${attempt})`);
      const res = await fetch(`${CENTRAL_SYSTEM_API_URL}/products/sync/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_id: syncId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log(data.message);
      break;
    } catch (err) {
      console.warn(`Phase 3 attempt ${attempt} failed: ${err.message}`);
      if (attempt === MAX_RETRIES) {
        console.error("Phase 3 failed after max retries. Aborting safely.");
        return;
      }
      await delay(2000);
    }
  }

  console.timeEnd("Trenbe Full Sync Time");
}

export async function main() {
  try {
    // console.time("Trenbe SKU Extraction Time");

    const skus = await getAllTrenbeSKUs();
    if (skus.length === 0) {
      console.log("No SKUs from Trenbe. Exiting safely.");
      return;
    }

    await fs.writeFile("trenbe_skus.json", JSON.stringify(skus, null, 2));
    console.log("SKUs saved to trenbe_skus.json");

    await threePhaseSync(skus);
    // console.timeEnd("Trenbe SKU Extraction Time");
  } catch (err) {
    console.error("Main process error:", err);
  }
}

// main();



















// import fs from "fs/promises";
// import { fetchTrenbeProducts } from "../services/fetchTrenbe.mjs";

// const CENTRAL_SYSTEM_API_URL = "https://api.theprivypursuit.com/api";
// const SOURCE_MODULE_ID = "tb_module";
// const SKU_CHUNK_SIZE = 2000;

// async function getAllTrenbeSKUs() {
//   console.log("Fetching data from Trenbe...");

//   const products = await fetchTrenbeProducts();
//   console.log(` Received ${products.length} products from Trenbe.`);

//   // Extract SKUs safely
//   const skus = products
//     .map((p) => p.productId)
//     .filter(Boolean)
//     .map((s) => s.trim());

//   console.log(` Extracted ${skus.length} SKUs from Trenbe.`);
//   console.log(skus, "..."); // show first few for verification

//   return skus;
// }

// async function threePhaseSync(skus) {
//   console.time(" Trenbe Full Sync Time");

//   //  Phase 1: Initialize Sync
//   console.log(" Phase 1: Initializing sync...");
//   let syncId;
//   try {
//     const res = await fetch(`${CENTRAL_SYSTEM_API_URL}/products/sync/init`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ source_module_id: SOURCE_MODULE_ID }),
//     });

//     if (!res.ok) throw new Error(`Init failed with status ${res.status}`);
//     const data = await res.json();
//     syncId = data.sync_id;
//     console.log(" Sync initialized:", data);
//   } catch (err) {
//     console.error(" Error initializing sync:", err);
//     return;
//   }

//   //  Phase 2: Stream SKUs
//   console.log(" Phase 2: Streaming SKU batches...");
//   for (let i = 0; i < skus.length; i += SKU_CHUNK_SIZE) {
//     const chunk = skus.slice(i, i + SKU_CHUNK_SIZE);
//     console.log(
//       ` Sending batch ${i / SKU_CHUNK_SIZE + 1} (${chunk.length} SKUs)...`
//     );
//     try {
//       const res = await fetch(
//         `${CENTRAL_SYSTEM_API_URL}/products/sync/stream`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ sync_id: syncId, sku_oris: chunk }),
//         }
//       );

//       if (!res.ok)
//         throw new Error(`Stream failed at batch ${i} status ${res.status}`);
//       const data = await res.json();
//       console.log(` ${data.message}`);
//     } catch (err) {
//       console.error(" Error streaming SKUs:", err);
//       return;
//     }
//   }

//   //  Phase 3: Finalize Sync
//   console.log(" Phase 3: Finalizing sync...");
//   try {
//     const res = await fetch(
//       `${CENTRAL_SYSTEM_API_URL}/products/sync/finalize`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ sync_id: syncId }),
//       }
//     );

//     if (!res.ok) throw new Error(`Finalize failed with status ${res.status}`);
//     const data = await res.json();
//     console.log(`${data.message}`);
//   } catch (err) {
//     console.error(" Error finalizing sync:", err);
//   }

//   console.timeEnd(" Trenbe Full Sync Time");
// }

// export async function main() {
//   try {
//     console.time("Trenbe SKU Extraction Time");

//     const skus = await getAllTrenbeSKUs();

//     console.log(` Total SKUs ready for sync: ${skus.length}`);
//     await fs.writeFile("trenbe_skus.json", JSON.stringify(skus, null, 2));
//     console.log(" SKUs saved to trenbe_skus.json");

//     if (skus.length > 0) {
//       await threePhaseSync(skus);
//     } else {
//       console.log(" No SKUs found — skipping sync.");
//     }
//     console.timeEnd("Trenbe SKU Extraction Time");
//   } catch (err) {
//     console.error(" Main process error:", err);
//   }
// }

// main();
