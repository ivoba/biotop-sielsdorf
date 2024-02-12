import {
  readFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import * as https from "https";
import { pipeline } from "stream";
import { parse, transform } from "csv/sync";
//import StaticMaps from "staticmaps";

// todo group by artengruppe
// todo via option?

export async function transformCsv2Json(csvFile, jsonFile, imgDir) {
  // todo if jsonFile exists read it
  // const dataJson = JSON.parse(readFileSync(jsonFile).toString());
  // todo if not create dataJson
  const dataJson = { species: {}, location: {} };

  await prepareAssets(imgDir);

  const { count, species, location } = await transformCsvGrouped(
    csvFile,
    imgDir
  );
  dataJson.species = species;
  dataJson.count = count;
  // todo load json and fill missing fields
  // take date & location from first row
  // create static map and store to public
  // move map creation to own file
  // dataJson.location = await makeMap(location, destinationDir);

  // write to file
  writeFileSync(jsonFile, JSON.stringify(dataJson));
}

export const prepareAssets = async (imgDir) => {
  if (!existsSync(imgDir)) {
    mkdirSync(imgDir);
    console.log(`Directory '${imgDir}' created successfully.`);
  } else {
    console.log(`Directory '${imgDir}' already exists.`);
  }
};

const makeMap = async (location, destinationDir) => {
  if (location?.lat && location?.lng) {
    const map = new StaticMaps({
      width: 400,
      height: 200,
    });

    const lat = location.lat;
    const lng = location.lng;
    const marker = {
      img: new URL(`./marker.png`, import.meta.url).pathname,
      offsetX: 12,
      offsetY: 48,
      width: 24,
      height: 24,
      coord: [lng, lat],
    };
    map.addMarker(marker);
    await map.render([lng, lat], 13);
    const mapImg = `${destinationDir}/img/map.png`;
    await map.image.save(mapImg, { compressionLevel: 9 });
    location.map_image = `./img/map.png`;
    console.log("Map saved to " + mapImg);
  }
  return location;
};

const makeFLickrUrl = async (bildUrl) => {
  if (bildUrl === undefined || bildUrl === "") {
    return;
  }
  const url = new URL(bildUrl);
  let bildId = url.searchParams.get("bild");
  bildId = `NGID${bildId.replace("-", "n")}`;
  const res = await fetch(
    `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${process.env.SECRET_FLICKR_API_KEY}&tags=${bildId}&format=json&nojsoncallback=1`
  );
  const json = await res.json();
  if (json.photos && json.photos.photo.length > 0) {
    const img = json.photos.photo[0];
    return `https://live.staticflickr.com/${img.server}/${img.id}_${img.secret}_b.jpg`;
  }
};

async function download(source, destination) {
  const file = createWriteStream(destination);

  https.get(source, (response) => {
    pipeline(response, file, (err) => {
      if (err) console.error("Download failed.", err);
      else console.log(source + " Download succeeded.");
    });
  });
}

// todo move to helper
const sortObj = async (obj) =>
  Object.keys(obj)
    .sort()
    .reduce((accumulator, key) => {
      accumulator[key] = obj[key];
      return accumulator;
    }, {});

async function transformCsvGrouped(file, imgDir) {
  const input = readFileSync(file);
  let rawRecords = parse(input, {
    delimiter: ";",
  });
  let speciesCount = 0;
  // delete first header row
  rawRecords.shift();

  const refinedRecords = transform(rawRecords, (data) => ({
    date: data[7],
    artengruppe: data[15],
    trivial: data[20],
    art: data[18],
    name: data[19],
    link: data[33],
  }));

  // sort by Artengruppe
  const grouped = refinedRecords.reduce((reduced, x) => {
    reduced[x["artengruppe"]] = reduced[x["artengruppe"]] || [];

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
        //const img = await fetchImg(sorted[key][art]["link"]);
        const flickrImg = await makeFLickrUrl(sorted[key][art]["link"]);
        let name = sorted[key][art].name.replace(/\.|[\/]/g, "-");
        const imgName = `${sorted[key][art].art}-${name}.jpg`;
        const localImg = `${imgDir}/${imgName}`;
        if (existsSync(localImg) === false && flickrImg !== undefined) {
          await download(flickrImg, localImg);
        } else if (flickrImg !== undefined) {
          console.log("Existing Img: " + flickrImg);
        }
        sorted[key][art].image = imgName;
        sorted[key][art].flickr_image = flickrImg;
      }
    }
    sorted[key] = await sortObj(sorted[key]);
  }

  const location = {
    lng: parseFloat(rawRecords[0][5].replace(",", ".")),
    lat: parseFloat(rawRecords[0][6].replace(",", ".")),
    name: rawRecords[0][1],
    country: rawRecords[0][2],
    region: rawRecords[0][3],
    car_code: rawRecords[0][4],
    map_image: null,
  };

  return { count: speciesCount, species: sorted, location: location };
}

async function transformCsv(file, imgDir) {
  const input = readFileSync(file);
  let rawRecords = parse(input, {
    delimiter: ";",
  });
  // delete first header row
  rawRecords.shift();

  const refinedRecords = transform(rawRecords, (data) => ({
    date: data[7],
    artengruppe: data[15],
    trivial: data[20],
    art: data[18],
    name: data[19],
    link: data[33],
  }));

  const species = await Promise.all(
    refinedRecords.map(async (data) => {
      let name = data.name.replace(/\.|[\/]/g, "-");
      const imgName = `${data.art}-${name}.jpg`;
      const flickrImg = await makeFLickrUrl(data.link);
      // todo Barypeithes-indet-.jpg is empty
      const localImg = `${imgDir}/${imgName}`;
      const relativeImgPath = `./img/${imgName}`;
      // todo force option
      if (existsSync(localImg) === false && flickrImg !== undefined) {
        await download(flickrImg, localImg);
      } else if (flickrImg !== undefined) {
        console.log("Existing Img: " + flickrImg);
      }
      // todo check if download was successful, if not, dont assign
      if (flickrImg) {
        data.image = relativeImgPath;
        data.flickr_image = flickrImg;
      }
      return data;
    })
  );

  const location = {
    lng: parseFloat(rawRecords[0][5].replace(",", ".")),
    lat: parseFloat(rawRecords[0][6].replace(",", ".")),
    name: rawRecords[0][1],
    country: rawRecords[0][2],
    region: rawRecords[0][3],
    car_code: rawRecords[0][4],
    map_inage: null,
  };

  return [species, location];
}
