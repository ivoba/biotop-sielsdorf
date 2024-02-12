import { program } from "commander";
import { transformCsv2Json } from "./src/dataloader.js";

program
  .command("csv2json")
  .argument("<csv>", "naturgucker csv export")
  .argument("<json>", "destination of json file")
  .argument("<imgDir>", "destination of image files")
  .action((csv, json, imgDir) => {
     console.log("csv2json: " + csv);
    transformCsv2Json(csv, json, imgDir);
  });

  program.parse(process.argv);