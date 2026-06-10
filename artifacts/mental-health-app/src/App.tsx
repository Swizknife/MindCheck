import { ThemeProvider } from "@/components/theme-provider";
import VideoTemplate from "@/components/video/VideoTemplate";

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <VideoTemplate />
    </ThemeProvider>
  );
}

export default App;