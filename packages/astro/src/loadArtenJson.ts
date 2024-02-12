import * as fs from "fs";
import { Specie } from "./types";

export async function loadData(jsonFile: string): Promise<{ species: Specie[], location: {} }> {
  if (fs.existsSync(jsonFile) === false) {
    console.error(jsonFile + " not found");
    return;
  }

  return JSON.parse(fs.readFileSync(jsonFile).toString());
}