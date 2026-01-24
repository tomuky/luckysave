import { useEffect, useState } from "react";
import { useEnsName, usePublicClient } from "wagmi";
import { base } from "wagmi/chains";

import { shortAddress } from "@/lib/format";

const useWalletLabel = (address) => {
  const { data: baseName } = useEnsName({
    address,
    chainId: base.id,
    query: { enabled: Boolean(address) },
  });
  const mainnetClient = usePublicClient({ chainId: 1 });
  const [baseReverseName, setBaseReverseName] = useState(null);

  useEffect(() => {
    let active = true;
    const resolveBaseName = async () => {
      if (!address || !mainnetClient) return;
      try {
        const name = await mainnetClient.getEnsName({
          address,
          coinType: 2147492101,
        });
        if (active) setBaseReverseName(name);
      } catch (error) {
        if (active) setBaseReverseName(null);
      }
    };
    resolveBaseName();
    return () => {
      active = false;
    };
  }, [address, mainnetClient]);

  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: Boolean(address) && !baseName && !baseReverseName },
  });

  return (
    baseName || baseReverseName || ensName || (address ? shortAddress(address) : "")
  );
};

export default useWalletLabel;
