export const chunkArray = (arr:Array<any>, n:number): Array<any> =>
  arr.reduce(function (p, c, i) {
    if (i % n === 0) p.push([]);
    p[p.length - 1].push(c);
    return p;
  }, []);

export const dateParser = (input) => {
  const parts = input.match(/(\d+)/g);
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

export const sortObj = async (obj:Object) =>
  Object.keys(obj)
    .sort()
    .reduce((accumulator, key) => {
      accumulator[key] = obj[key];
      return accumulator;
    }, {});
