import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnalysisPage } from "./pages/AnalysisPage";
import { CustomQuestionPage } from "./pages/CustomQuestionPage";
import { InterviewPage } from "./pages/InterviewPage";
import { InterviewListPage } from "./pages/InterviewListPage";
import { InterviewSetupPage } from "./pages/InterviewSetupPage";
import { ReviewPage } from "./pages/ReviewPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InterviewListPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/interview/new" element={<InterviewSetupPage />} />
        <Route
          path="/interview/new/question"
          element={<CustomQuestionPage />}
        />
        <Route path="/interviews" element={<Navigate to="/" replace />} />
        <Route path="/interviews/:id" element={<ReviewPage />} />
        <Route path="/interviews/:id/analysis" element={<AnalysisPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
