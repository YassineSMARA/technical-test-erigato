import './NftGrid.css';
import {useEffect, useState} from "react";
import {Connection, ParsedAccountData, PublicKey} from "@solana/web3.js";
import {Metaplex} from "@metaplex-foundation/js";
import {useWallet} from "@solana/wallet-adapter-react";
import {TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {Nft} from "../interface";

const connection = new Connection("");
const metaplex = new Metaplex(connection);

/**
 * Fetch the MintPublicKeys for a list of accounts
 * @param parsedAccountsData Array of ParsedAccountData
 * @returns {Promise<PublicKey[]>}
 */
async function getMintPublicKeys (parsedAccountsData: ParsedAccountData[]): Promise<PublicKey[]> {
  const mintPublicKeys: PublicKey[] = [];

  for (const parsedAccount of parsedAccountsData) {
    if (parsedAccount.parsed["info"]["tokenAmount"]["uiAmount"] === 1) {
      mintPublicKeys.push(new PublicKey(parsedAccount.parsed["info"]["mint"]));
    }
  }

  return mintPublicKeys;
}

/**
 * Fetch the NFTs for a list of MintPublicKeys
 * @param mintPublicKeys Array of PublicKey
 * @returns {Promise<Nft[]>}
 */
async function getNfts(mintPublicKeys: PublicKey[]): Promise<Nft[]> {
  const nftsOutput = await metaplex.nfts().findAllByMintList({
    mints: mintPublicKeys
  });

  const result : Nft[] = [];

  for (const nft of nftsOutput) {
    if (nft && nft.uri) {
      const response = await fetchTimeout(nft.uri);
      if (response) {
        const metadata = await response.json();
        if (metadata && metadata.name && metadata.image && metadata.attributes) {
          result.push({
            name: metadata.name,
            image: metadata.image,
            attributes: metadata.attributes
          });
        } else {
          console.error('wrong metadata schema', nft.uri);
        }
      } else {
        console.error('failed to fetch uri', nft.uri);
      }
    }
  }

  return result;
}

/**
 * Fetch the filtered program accounts for the given public key
 * @param pubKey Public key to filter the program accounts
 * @returns Array of ParseAccountData
 */
async function getAccounts(pubKey: PublicKey): Promise<ParsedAccountData[]> {
  const parsedProgramAccounts = await connection.getParsedProgramAccounts(
    TOKEN_PROGRAM_ID,
    {
      filters: [
        {
          dataSize: 165,
        },
        {
          memcmp: {
            offset: 32,
            bytes: pubKey.toBase58(),
          }
        }
      ]
    }
  );

  return parsedProgramAccounts.map((parsedProgramAccount) => {
    return parsedProgramAccount.account.data as ParsedAccountData;
  });
}

/**
 * Fetch the URI with a timeout
 * @param uri URI to fetch
 */
async function fetchTimeout(uri: string): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 5000);
  const response = await fetch(uri, { signal: controller.signal }).catch(
    () => null
  );
  clearTimeout(id);
  return response;
}

export function NftGrid() {
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedNfts, setSelectedNfts] = useState<Nft[]>([]);
  const { publicKey } = useWallet();

  /**
   * Select / Unslect NFT on click, and update the state
   * @param nft NFT to select / unselect
   * @param index Index of the NFT in the array
   */
  const selectNft = (nft: Nft, index: number) => {
    const element = document.getElementsByClassName('nft_index_' + index)[0];
    if (selectedNfts.includes(nft)) {
      setSelectedNfts(selectedNfts.filter((selectedNft) => selectedNft !== nft));
      element.classList.remove('selected');
    } else {
      setSelectedNfts([...selectedNfts, nft]);
      element.classList.add('selected');
    }
  }

  /**
   * Persist the selected NFTs using Netlify functions
   */
  const persist = async () => {
    setIsLoading(true);
    const data = JSON.stringify({
      nfts: selectedNfts,
      owner: publicKey?.toBase58()
    });
    fetch('/.netlify/functions/persist', {
      method: 'POST',
      body: data
    }).then((response) => {
      if (response.status === 200) {
        alert('Data saved successfully');
      }
    }).catch(() => {
      alert('Error while saving data');
    }).finally(() => {
      setIsLoading(false);
    });
  }

  useEffect(() => {
    const init = async () => {
      if (publicKey) {
        setIsLoading(true);
        const accounts = await getAccounts(publicKey);
        const mintPublicKeys = await getMintPublicKeys(accounts);
        const nfts = await getNfts(mintPublicKeys);
        setNfts(nfts);
        setIsLoading(false);
      } else {
        setNfts([]);
        setSelectedNfts([]);
      }
    }
    init().catch(console.error);
  }, [publicKey]);

  return (
    <div className="nft-grid">
      {
        selectedNfts.length > 0 && !isLoading &&
        <button className={"button_persist"} onClick={persist}>Persist data</button>
      }
      {
        isLoading && <div className="loader">Loading...</div>
      }
      {nfts.map((nft, index) => (
        <div className={'nft nft_index_' + index} key={index} onClick={() => selectNft(nft, index)}>
          <div className="nft-description">
            <img className="nft-image" src={nft.image} alt={nft.name} />
            <div className="nft-name">{nft.name}</div>
          </div>
          <div className="nft-attributes">
            {nft.attributes.map((attribute, index) => (
              <div className="nft-attribute" key={index}>
                <div className="nft-attribute-name">{attribute.trait_type}</div>
                <div className="nft-attribute-value">{attribute.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
