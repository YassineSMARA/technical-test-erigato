interface Attribute {
  trait_type: string;
  value: string;
}

export interface Nft {
  name: string;
  image: string;
  attributes: Attribute[];
}
