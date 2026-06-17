const ALLOWED_COLORS = [
  "BLACK",
  "BLUE",
  "BROWN",
  "GRAY",
  "GREEN",
  "ORANGE",
  "PINK",
  "PURPLE",
  "RED",
  "WHITE",
  "YELLOW",
  "GOLD",
  "SILVER",
  "MULTI",
];

function extractColorFromTitle(title) {
  if (!title) return null;

  const upperTitle = title.toUpperCase();

  for (const color of ALLOWED_COLORS) {
    if (upperTitle.includes(color)) {
      return color;
    }
  }

  return null;
}




export function cleanTrenbeProduct(p) {
  const desc = p.description || "";
  console.log(desc)
  // Generic extractor function for <b>Field</b>: Value<br/>
  // function extract(field) {
  //   const regex = new RegExp(`<b>${field}</b>:\\s*([^<]+)<br/>`, "i");
  //   const match = desc.match(regex);
  //   return match ? match[1].trim() : null;
  // }
  function extract(field) {
    //  <b>Field</b>: Value<br/>
    const htmlRegex = new RegExp(
      `<b>${field}</b>:\\s*([^<]+)<br/>`,
      "i"
    );
    const htmlMatch = desc.match(htmlRegex);
    if (htmlMatch) return htmlMatch[1].trim();

    //  - Field: Value<br/>
    const plainRegex = new RegExp(
      `-\\s*${field}\\s*:\\s*([^<]+)<br/>`,
      "i"
    );
    const plainMatch = desc.match(plainRegex);
    if (plainMatch) return plainMatch[1].trim();

    return null;
  }

  let color = extract("Color");
  if (!color) {
    color = extractColorFromTitle(p.title);
  }
  const material = extract("Composition") || extract("Material");
  const dimensions = extract("Size") || extract("Dimensions");
  const gender = extract("Gender");
  const origin = extract("Origin");
  const brandName = p.brandName || extract("Brand");
  const condition = extract("Condition") || p.condition;
  const sku = extract("SKU") || p.productId;

  return {
    sku, // 100285624 or AS1160
    title: p.title, // Product Name
    brandName, // CHANEL
    color, // White / Lacquered Metal
    material, // Hampskin
    dimensions, // 26 cm × 16 cm × 9 cm ...
    gender, // Women
    origin, // Italy
    condition, // A
    categoryTags: p.categoryTags,
    productType: p.productType,
    status: p.productStatus,
    price: p.options?.[0]?.price,
    size: p.options?.[0]?.name,
    images: p.images,
    descriptionHTML: p.description, // Keep original HTML
    source: "trenbe",
    productId: p.productId,
    trenbeSKU: extract("trenbe Code"),
    offerId: p.offerId,
    shopifyUrl: p.shopifyUrl,
  };
}

