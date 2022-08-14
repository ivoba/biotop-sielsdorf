# Biotop Sielsdorf

Built with [Astro](https://astro.build).


## Resources
- https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics?file=src%2Fpages%2Findex.astro&on=stackblitz
- https://google-webfonts-helper.herokuapp.com/fonts/ibm-plex-sans?subsets=latin

# todo

- fix sorting
- Image component
- chunk observations for better grid
  function chunk(arr, n) {
  return arr.reduce(function (p, c, i) {
  if (i % n === 0) p.push([]);
  p[p.length - 1].push(c);
  return p;
  }, []);
  }

chunk(arr, 2); // [[1,2],[3,4],[5,6],[7]]
- collaboration with online editor like stackblitz
- favicon
- move to MDX https://docs.astro.build/en/guides/integrations-guide/mdx/
