import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InterviewPage } from "./pages/InterviewPage";
import { InterviewListPage } from "./pages/InterviewListPage";
import { ReviewPage } from "./pages/ReviewPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InterviewPage />} />
        <Route path="/reviews" element={<InterviewListPage />} />
        <Route path="/review/:id" element={<ReviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
