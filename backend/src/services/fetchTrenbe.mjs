import axios from "axios";
import streamJsonPkg from "stream-json";
import streamArrayPkg from "stream-json/streamers/StreamArray.js";

const { parser } = streamJsonPkg;
const { streamArray } = streamArrayPkg;

export async function fetchTrenbeProducts() {
  const url =
    "https://trenbe-product-ep-kr.s3.ap-northeast-2.amazonaws.com/global/all/ep-products.json";

  console.log("Streaming Trenbe JSON safely...");

  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 0,
  });

  const products = [];

  const pipeline = response.data
    .pipe(parser())
    .pipe(streamArray());

  for await (const { value } of pipeline) {
    if (value?.productId) {
      products.push({
        productId: value.productId,
      });
    }
  }

  console.log(`Trenbe stream completed. Products: ${products.length}`);
  return products;
}
