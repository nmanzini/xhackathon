import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnalysisPage } from "./pages/AnalysisPage";
import { InterviewPage } from "./pages/InterviewPage";
import { InterviewListPage } from "./pages/InterviewListPage";
import { ReviewPage } from "./pages/ReviewPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InterviewPage />} />
        <Route path="/interviews" element={<InterviewListPage />} />
        <Route path="/interviews/:id" element={<ReviewPage />} />
        <Route path="/interviews/:id/analysis" element={<AnalysisPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
