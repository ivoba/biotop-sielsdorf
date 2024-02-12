import { parse, transform } from "csv/sync";
import { sortObj } from "./helper";
import * as fs from "fs";
import { readFileSync, writeFileSync } from "fs";
import * as https from "https";
import { pipeline } from "stream";
import { Specie } from "./types";

async function loadData(jsonFile: string, csvFile: string): Promise<{ species: {}; count: number }> {
  let reload = false;
  if (fs.existsSync(jsonFile)) {
    let dateJson = fs.statSync(jsonFile);
    let dateCsv = fs.statSync(csvFile);
    const jsonData = readFileSync(jsonFile);

    if (dateJson.mtimeMs < dateCsv.mtimeMs) {
      reload = true;
    }
  } else {
    reload = true;
  }
  reload=true;
  if (reload) {
    let species = await loadCsv(csvFile);
    writeFileSync(jsonFile, JSON.stringify(species));
    return species;
  } else {
    return JSON.parse(readFileSync(jsonFile).toString());
  }
}

const fetchImg = async (bildUrl: string): Promise<string|undefined> => {
  const url = new URL(bildUrl);
  let bildId = url.searchParams.get("bild");
  bildId = `NGID${bildId.replace("-", "n")}`;
  const res = await fetch(
    `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${import.meta.env.SECRET_FLICKR_API_KEY}&tags=${bildId}&format=json&nojsoncallback=1`
  );
  const json = await res.json();

  if (json.photos && json.photos.photo.length > 0) {
    const img = json.photos.photo[0];
    return `https://live.staticflickr.com/${img.server}/${img.id}_${img.secret}_b.jpg`;
  }
};

async function loadCsv(file: string): Promise<{ species: {}; count: number }> {
  const input = readFileSync(file);
  let rawRecords = parse(input, {
    delimiter: ";",
  });
  let speciesCount: number = 0;
  // delete first header row
  rawRecords.shift();

  const refinedRecords = transform(
    rawRecords,
    (data): Specie => ({
      date: data[7],
      artengruppe: data[15],
      trivial: data[20],
      art: data[18],
      name: data[19],
      link: data[33],
    })
  );

  // sort by Artengruppe
  const grouped = refinedRecords.reduce((reduced, x) => {
    reduced[x["artengruppe"]] = reduced[x["artengruppe"]] || []!;

    let speciesName = `${x["art"]} ${x["name"]}`;
    // group by art
    // prefer one with img
    if (reduced[x["artengruppe"]][speciesName] === undefined || x.link !== "") {
      reduced[x["artengruppe"]][speciesName] = x;
      speciesCount++;
    }
    // todo count oberservations, take last observed, maybe by reducing again with count

    return reduced;
  }, {});

  let sorted = await sortObj(grouped);
  for await (let key of Object.keys(sorted)) {
    for (let art in sorted[key]) {
      if (sorted[key][art]["link"]) {
        const img = await fetchImg(sorted[key][art]["link"]);
        // todo Barypeithes-indet-.jpg is empty
        let name = sorted[key][art].name.replace(/\.|[\/]/g, "-");
        const imgName = `${sorted[key][art].art}-${name}.jpg`;
        const localImg = `./src/assets/arten/${imgName}`;
        if (fs.existsSync(localImg) === false && img !== undefined) {
          await download(img, localImg);
        }
        sorted[key][art].image = imgName;
        sorted[key][art].flickr_image = img;
      }
    }
    sorted[key] = await sortObj(sorted[key]);
  }

  return { count: speciesCount, species: sorted };
}

async function download(source: string, destination: string): Promise<void> {
  const file = fs.createWriteStream(destination);

  https.get(source, (response) => {
    pipeline(response, file, (err) => {
      if (err) console.error("Download failed.", err);
      else console.log(source + " Download succeeded.");
    });
  });
}

export { loadData, loadCsv };
