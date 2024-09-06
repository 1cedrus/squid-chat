import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "@/App";
import { deployments } from "@/contracts/deployments.ts";
import TypinkProvider from "@/providers/TypinkProvider.tsx";
import { theme } from "@/theme";
import { NetworkId } from "@/utils/networks.ts";
import SquidProvider from "./providers/SquidProvider";

const DEFAULT_CALLER = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"; // Alice

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <ChakraProvider theme={theme}>
    <TypinkProvider
      deployments={deployments}
      defaultCaller={DEFAULT_CALLER}
      defaultNetworkId={NetworkId.POP_TESTNET}
    >
      <SquidProvider>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
        <ToastContainer
          position="top-right"
          closeOnClick
          pauseOnHover
          theme="light"
          autoClose={5_000}
          hideProgressBar
          limit={2}
        />
      </SquidProvider>
    </TypinkProvider>
  </ChakraProvider>
);
