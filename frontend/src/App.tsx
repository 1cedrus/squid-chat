import { Center, Flex } from "@chakra-ui/react";
import BalanceInsufficientAlert from "@/components/shared/BalanceInsufficientAlert.tsx";
import MainFooter from "@/components/shared/MainFooter";
import MainHeader from "@/components/shared/MainHeader";
import Squid from "./components/squid/Squid";
import { useTypink } from "./providers/TypinkProvider";

function App() {
  const { selectedAccount } = useTypink();

  const isConnected = !!selectedAccount;

  return (
    <Flex direction="column" minHeight="100vh" maxHeight="100vh">
      <MainHeader />
      <BalanceInsufficientAlert />
      <Flex
        maxWidth="container.md"
        mx="auto"
        my={4}
        px={4}
        flex={1}
        w="full"
        overflowY="auto"
      >
        {isConnected ? <Squid /> : <Center>Connect your wallet first!</Center>}
      </Flex>
      <MainFooter />
    </Flex>
  );
}

export default App;
