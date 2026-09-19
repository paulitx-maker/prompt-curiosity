import { Client } from "@notionhq/client";
const n = new Client({auth:"test"});
console.log(Object.keys(n));
console.log("dataSources:", !!n.dataSources);