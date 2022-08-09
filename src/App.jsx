import { Box, Container, Text ,VStack} from '@chakra-ui/react';
import ScheduleForm from './ScheduleForm';

function App() {
  return (
    <Box my={6}>
      <Container>
        <VStack>
          <Text>排班表表單範例</Text>
          <Text>兩層巢狀式，服務時間重疊判斷及錯誤顯示</Text>
        </VStack>
        <ScheduleForm />
      </Container>
    </Box>
  );
}

export default App;
