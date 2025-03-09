import * as fs from "fs";
import { Specie } from "./types";

export async function loadData(jsonFile: string): Promise<{ species: Record<string, Record<string, Specie>>, location: {}, count: number }> {
  if (fs.existsSync(jsonFile) === false) {
    console.error(jsonFile + " not found");
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonFile).toString()) as { species: Record<string, Record<string, Specie>>, location: {} };
  const totalCount = Object.values(data.species).reduce((sum, group) => sum + Object.keys(group).length, 0);
  
  return { ...data, count: totalCount };
}