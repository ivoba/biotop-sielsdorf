export interface Specie {
  date: string,
  artengruppe: string,
  trivial: string,
  art: string,
  name: string,
  link: string,
  image?: string,
  flickr_image?: string
}

export interface Species {
  count: number,
  species: Array<Specie>
}